import { randomUUID } from "node:crypto";
import { chmod, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { applyEdits, modify } from "jsonc-parser";
import { loadCatalog } from "../src/manager.ts";

const DEFAULT_CATALOG = resolve(import.meta.dir, "../registry/catalog.jsonc");
const REVISION_PATTERN = /^[a-f0-9]{40}$/;

export interface RevisionChange {
  id: string;
  repository: string;
  previous: string;
  revision: string;
}

export type RevisionResolver = (repository: string) => Promise<string>;

export interface UpdateRevisionOptions {
  catalogPath?: string;
  write?: boolean;
  resolveRevision?: RevisionResolver;
}

export async function resolveGitHead(repository: string): Promise<string> {
  const child = Bun.spawn(
    [
      "git",
      "-c",
      "protocol.file.allow=never",
      "-c",
      "core.hooksPath=/dev/null",
      "ls-remote",
      "--exit-code",
      repository,
      "HEAD",
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_LFS_SKIP_SMUDGE: "1",
        GIT_TERMINAL_PROMPT: "0",
        GCM_INTERACTIVE: "never",
      },
    },
  );
  const timer = setTimeout(() => child.kill(), 90_000);
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]).finally(() => clearTimeout(timer));
  if (exitCode !== 0) {
    throw new Error(`Unable to resolve ${repository} HEAD: ${stderr.trim() || `git exited ${exitCode}`}`);
  }
  const revision = stdout.match(/^([a-f0-9]{40})\s+HEAD$/m)?.[1]?.toLowerCase();
  if (!revision || !REVISION_PATTERN.test(revision)) {
    throw new Error(`Repository ${repository} did not return a full HEAD commit SHA`);
  }
  return revision;
}

async function writeAtomic(file: string, source: string): Promise<void> {
  const info = await stat(file);
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, source, { encoding: "utf8", mode: info.mode & 0o777 });
    await chmod(temporary, info.mode & 0o777);
    await rename(temporary, file);
  } finally {
    await rm(temporary, { force: true });
  }
}

export async function updateSkillSourceRevisions(options: UpdateRevisionOptions = {}): Promise<RevisionChange[]> {
  const catalogPath = resolve(options.catalogPath ?? DEFAULT_CATALOG);
  const catalog = await loadCatalog({ catalogPath });
  const resolveRevision = options.resolveRevision ?? resolveGitHead;
  const revisions = new Map<string, string>();

  for (const source of Object.values(catalog.skillSources)) {
    if (source.type !== "git" || revisions.has(source.repository)) continue;
    const revision = (await resolveRevision(source.repository)).toLowerCase();
    if (!REVISION_PATTERN.test(revision)) {
      throw new Error(`Repository ${source.repository} resolver returned an invalid commit SHA`);
    }
    revisions.set(source.repository, revision);
  }

  const changes: RevisionChange[] = [];
  for (const [id, source] of Object.entries(catalog.skillSources)) {
    if (source.type !== "git") continue;
    const revision = revisions.get(source.repository)!;
    if (source.revision === revision) continue;
    changes.push({ id, repository: source.repository, previous: source.revision, revision });
  }

  if (changes.length > 0 && options.write !== false) {
    let updated = await readFile(catalogPath, "utf8");
    for (const change of changes) {
      updated = applyEdits(
        updated,
        modify(updated, ["skillSources", change.id, "revision"], change.revision, {
          formattingOptions: { insertSpaces: true, tabSize: 2 },
        }),
      );
    }
    await writeAtomic(catalogPath, updated);
    await loadCatalog({ catalogPath });
  }

  return changes;
}

interface CliOptions {
  catalogPath: string;
  mode: "write" | "dry-run" | "check";
}

function parseCli(args: string[]): CliOptions {
  let catalogPath = DEFAULT_CATALOG;
  let mode: CliOptions["mode"] = "write";
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--catalog") {
      const value = args[index + 1];
      if (!value) throw new Error("--catalog requires a path");
      catalogPath = resolve(value);
      index += 1;
    } else if (argument === "--dry-run") {
      mode = "dry-run";
    } else if (argument === "--check") {
      mode = "check";
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { catalogPath, mode };
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const changes = await updateSkillSourceRevisions({
    catalogPath: options.catalogPath,
    write: options.mode === "write",
  });
  if (changes.length === 0) {
    console.log("All git skill sources already point to their remote HEAD revisions.");
    return;
  }
  for (const change of changes) {
    console.log(`${change.id}: ${change.previous.slice(0, 12)} -> ${change.revision.slice(0, 12)}`);
  }
  if (options.mode === "check") process.exitCode = 1;
}

if (import.meta.main) {
  await main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
