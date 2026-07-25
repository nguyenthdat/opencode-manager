import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { listSkills, loadCatalog, type GitSkillSource } from "../src/manager.ts";

const DEFAULT_CATALOG = resolve(import.meta.dir, "../registry/catalog.jsonc");

interface CliOptions {
  catalogPath: string;
  concurrency: number;
  sourceIDs: string[];
}

interface ValidatedSource {
  id: string;
  count: number;
  paths: string[];
  revision: string;
}

interface FailedSource {
  id: string;
  error: string;
}

function parseCli(args: string[]): CliOptions {
  let catalogPath = DEFAULT_CATALOG;
  let concurrency = 3;
  const sourceIDs: string[] = [];
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    const value = args[index + 1];
    if (argument === "--catalog") {
      if (!value) throw new Error("--catalog requires a path");
      catalogPath = resolve(value);
      index += 1;
    } else if (argument === "--concurrency") {
      if (!value || !/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 8) {
        throw new Error("--concurrency must be an integer from 1 to 8");
      }
      concurrency = Number(value);
      index += 1;
    } else if (argument === "--source") {
      if (!value) throw new Error("--source requires an id");
      sourceIDs.push(value);
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return { catalogPath, concurrency, sourceIDs };
}

async function main(): Promise<void> {
  const options = parseCli(process.argv.slice(2));
  const catalog = await loadCatalog({ catalogPath: options.catalogPath });
  const available = Object.entries(catalog.skillSources).filter(
    (entry): entry is [string, GitSkillSource] => entry[1].type === "git",
  );
  const requested = options.sourceIDs.length > 0 ? new Set(options.sourceIDs) : undefined;
  if (requested) {
    for (const id of requested) {
      if (!available.some(([sourceID]) => sourceID === id)) throw new Error(`Unknown git skill source: ${id}`);
    }
  }
  const sources = requested ? available.filter(([id]) => requested.has(id)) : available;
  const projectRoot = await mkdtemp(join(tmpdir(), "opencode-manager-source-validation-"));
  const results: (ValidatedSource | FailedSource)[] = [];
  let cursor = 0;

  try {
    const workers = Array.from({ length: Math.min(options.concurrency, sources.length) }, async () => {
      while (cursor < sources.length) {
        const current = cursor;
        cursor += 1;
        const [id, source] = sources[current]!;
        try {
          const skills = await listSkills({ projectRoot, catalogPath: options.catalogPath }, id);
          if (skills.length === 0) throw new Error("source contains no selectable skills");
          results[current] = {
            id,
            count: skills.length,
            paths: skills.map((skill) => skill.path),
            revision: source.revision,
          };
        } catch (error) {
          results[current] = { id, error: error instanceof Error ? error.message : String(error) };
        }
      }
    });
    await Promise.all(workers);
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }

  const validated = results.filter((result): result is ValidatedSource => !("error" in result));
  const pathsBySource = new Map(validated.map((result) => [result.id, new Set(result.paths)]));
  const profileErrors: string[] = [];
  for (const profile of catalog.profiles) {
    for (const skill of profile.skills) {
      const sourcePaths = pathsBySource.get(skill.source);
      if (sourcePaths && !sourcePaths.has(skill.path)) {
        profileErrors.push(`${profile.id}: missing upstream skill ${skill.source}:${skill.path}`);
      }
    }

    const sourcePaths = pathsBySource.get(profile.id);
    if (!sourcePaths) continue;
    const profilePaths = new Set(
      profile.skills.filter((skill) => skill.source === profile.id).map((skill) => skill.path),
    );
    const omitted = [...sourcePaths].filter((path) => !profilePaths.has(path));
    if (omitted.length > 0) {
      profileErrors.push(`${profile.id}: profile omits ${omitted.join(", ")}`);
    }
  }

  for (const result of results) {
    if ("error" in result) console.error(`${result.id}: ${result.error}`);
    else console.log(`${result.id}: ${result.count} skills @ ${result.revision.slice(0, 12)}`);
  }
  for (const error of profileErrors) console.error(error);
  const failures = results.filter((result) => "error" in result);
  if (failures.length > 0 || profileErrors.length > 0) {
    throw new Error(
      `${failures.length} git skill source(s) and ${profileErrors.length} profile issue(s) failed validation`,
    );
  }
  console.log(`Validated ${results.length} git skill sources.`);
}

if (import.meta.main) {
  await main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
