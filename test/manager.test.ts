import { afterEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import {
  chmod,
  lstat,
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  symlink,
  unlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import { updateSkillSourceRevisions } from "../scripts/update-skill-source-revisions.ts";
import plugin, { resolveProjectRoot } from "../src/tui.ts";
import {
  getProfile,
  listInstallers,
  listAgents,
  listMcps,
  listPlugins,
  listProfiles,
  listRules,
  listSkills,
  loadCatalog,
  setAgentEnabled,
  setInstallerEnabled,
  setMcpEnabled,
  setPluginEnabled,
  setProfileEnabled,
  setRuleEnabled,
  setSkillEnabled,
  setSkillSourceEnabled,
  syncRegistry,
} from "../src/manager.ts";

const temporaryRoots: string[] = [];

async function exists(path: string): Promise<boolean> {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function git(cwd: string, ...args: string[]): Promise<string> {
  const child = Bun.spawn(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);
  if (exitCode !== 0) throw new Error(`git ${args[0] ?? "command"} failed: ${stderr.trim()}`);
  return stdout.trim();
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "opencode-manager-test-"));
  temporaryRoots.push(root);
  const registry = join(root, "registry");
  const projectRoot = join(root, "project");
  const skillRoot = join(registry, "skills", "fixture-skill");
  const nestedRoot = join(skillRoot, "nested");
  const rulesRoot = join(registry, "rules");
  const agentsRoot = join(registry, "agents");
  const teamRoot = join(agentsRoot, "fixture-team");
  await Promise.all([
    mkdir(projectRoot, { recursive: true }),
    mkdir(nestedRoot, { recursive: true }),
    mkdir(rulesRoot, { recursive: true }),
    mkdir(teamRoot, { recursive: true }),
  ]);
  await writeFile(
    join(skillRoot, "SKILL.md"),
    `---\nname: fixture-skill\ndescription: Use when testing the local skill registry.\n---\n\n# Fixture\n`,
  );
  await writeFile(join(skillRoot, "reference.txt"), "registry asset\n");
  await writeFile(
    join(nestedRoot, "SKILL.md"),
    `---\nname: nested-skill\ndescription: Nested skill included in the fixture bundle.\n---\n\n# Nested\n`,
  );
  await writeFile(join(rulesRoot, "fixture-rule.md"), "# Fixture Rule\n\nKeep fixture behavior deterministic.\n");
  await writeFile(
    join(agentsRoot, "fixture-agent.md"),
    `---\ndescription: Handles a standalone fixture task.\nmode: subagent\n---\n\n# Fixture Agent\n\nReturn one deterministic result.\n`,
  );
  await writeFile(
    join(teamRoot, "lead.md"),
    `---\ndescription: Coordinates the fixture team.\nmode: subagent\n---\n\n# Lead\n\nRelay work between fixture members.\n`,
  );
  await writeFile(
    join(teamRoot, "reviewer.md"),
    `---\ndescription: Reviews fixture team output.\nmode: subagent\n---\n\n# Reviewer\n\nReturn review findings to the lead.\n`,
  );

  const catalogPath = join(registry, "catalog.jsonc");
  await writeFile(
    catalogPath,
    JSON.stringify(
      {
        version: 1,
        mcps: {
          docs: {
            title: "Docs",
            description: "Fixture documentation server.",
            tags: ["docs"],
            config: {
              type: "remote",
              url: "https://example.com/mcp",
              headers: { Authorization: "Bearer {env:FIXTURE_TOKEN}" },
              enabled: false,
            },
          },
        },
        plugins: {
          fixture: {
            title: "Fixture Plugin",
            description: "Fixture OpenCode plugin.",
            tags: ["test"],
            package: "@fixture/opencode",
          },
        },
        skillSources: {
          custom: {
            type: "local",
            title: "Custom",
            path: "skills",
            skillsPath: ".",
          },
        },
        rules: {
          "fixture-rule": {
            title: "Fixture Rule",
            description: "Fixture project instruction.",
            tags: ["test"],
            path: "rules/fixture-rule.md",
          },
        },
        agents: {
          "fixture-agent": {
            type: "single",
            title: "Fixture Agent",
            description: "Fixture standalone agent.",
            tags: ["test"],
            path: "agents/fixture-agent.md",
          },
          "fixture-team": {
            type: "team",
            title: "Fixture Team",
            description: "Fixture folder-based agent team.",
            tags: ["test"],
            path: "agents/fixture-team",
          },
        },
        profiles: [
          {
            id: "fixture",
            title: "Fixture",
            description: "Fixture project profile.",
            tags: ["test"],
            mcps: ["docs"],
            skills: [{ source: "custom", path: "fixture-skill" }],
            rules: ["fixture-rule"],
            agents: ["fixture-agent", "fixture-team"],
          },
        ],
      },
      null,
      2,
    ),
  );
  return {
    root,
    registry,
    projectRoot,
    catalogPath,
    options: { projectRoot, catalogPath },
  };
}

describe("registry", () => {
  test("loads the bundled MCP, plugin, and vendor skill registries", async () => {
    const catalog = await loadCatalog();
    expect(Object.keys(catalog.mcps).length).toBeGreaterThan(30);
    expect(catalog.mcps.github?.config.type).toBe("remote");
    expect(catalog.mcps.aws?.config.environment).toBeDefined();
    expect(catalog.plugins.svelte?.package).toBe("@sveltejs/opencode");
    const cloudflare = catalog.skillSources.cloudflare;
    expect(cloudflare?.type).toBe("git");
    expect(cloudflare?.type === "git" ? cloudflare.revision : "").toMatch(/^[a-f0-9]{40}$/);
    const hallmark = catalog.skillSources.hallmark;
    expect(hallmark).toMatchObject({ type: "git", skillsPath: "skills", license: "MIT" });
    expect(hallmark?.type === "git" ? hallmark.revision : "").toMatch(/^[a-f0-9]{40}$/);
    expect(catalog.profiles.find((profile) => profile.id === "hallmark")?.skills).toEqual([
      { source: "hallmark", path: "hallmark" },
    ]);
    const vercel = catalog.skillSources.vercel;
    expect(vercel).toMatchObject({ type: "git", skillsPath: "skills", license: "MIT" });
    expect(vercel?.type === "git" ? vercel.revision : "").toMatch(/^[a-f0-9]{40}$/);
    const requestedSources = {
      "k-dense-scientific": { skillsPath: "skills" },
      "pm-skills": { skillsPath: ".", license: "MIT" },
      "marketing-skills": { skillsPath: "skills", license: "MIT" },
      "addy-agent-skills": { skillsPath: "skills", license: "MIT" },
      "microsoft-core": { skillsPath: ".github/skills", license: "MIT", ignoreSymlinks: true },
      microsoft: { skillsPath: ".github/plugins", license: "MIT", ignoreSymlinks: true },
      qt: { skillsPath: "skills", license: "LicenseRef-Qt-Commercial OR BSD-3-Clause" },
      huggingface: { skillsPath: "skills", license: "Apache-2.0" },
      finance: { skillsPath: "plugins", license: "MIT" },
      "marketcalls-vectorbt": { skillsPath: ".claude/skills", license: "MIT" },
      "agiprolabs-trading": { skillsPath: "skills", license: "MIT" },
      okx: { skillsPath: "skills", license: "MIT" },
    } as const;
    for (const [id, expected] of Object.entries(requestedSources)) {
      const source = catalog.skillSources[id];
      expect(source).toMatchObject({ type: "git", ...expected });
      expect(source?.type === "git" ? source.revision : "").toMatch(/^[a-f0-9]{40}$/);
    }
    expect(catalog.skillSources["pm-skills"]?.type === "git" ? catalog.skillSources["pm-skills"].repository : "").toBe(
      "https://github.com/phuryn/pm-skills.git",
    );
    expect(catalog.installers?.gstack).toMatchObject({
      type: "git",
      repository: "https://github.com/garrytan/gstack.git",
      marker: ".config/opencode/skills/gstack/SKILL.md",
      license: "MIT",
    });
    expect(catalog.installers?.gstack?.revision).toMatch(/^[a-f0-9]{40}$/);
    expect(catalog.profiles.some((profile) => profile.id === "qdrant")).toBe(true);
    expect(Object.keys(catalog.rules)).toEqual(["codebase-memory", "parallel-agents"]);
    expect(catalog.agents["review-team"]?.type).toBe("team");
    expect(catalog.profiles.some((profile) => profile.id === "architecture")).toBe(true);
  });

  test("rejects duplicate JSONC keys", async () => {
    const value = await fixture();
    await writeFile(value.catalogPath, `{"version":1,"mcps":{},"mcps":{},"skillSources":{},"profiles":[]}`);
    await expect(loadCatalog({ catalogPath: value.catalogPath })).rejects.toThrow("Duplicate JSON property");
  });

  test("installs and removes a pinned external installer in an isolated HOME", async () => {
    const value = await fixture();
    const dataRoot = join(value.root, "installer-data");
    const home = join(value.root, "installer-home");
    const source = join(dataRoot, "installers", "fixture-installer-working");
    await mkdir(source, { recursive: true });
    await writeFile(
      join(source, "setup-test"),
      `#!/bin/sh
set -eu
mkdir -p "$HOME/.config/opencode/skills/fixture"
printf '%s\n' '---' 'name: fixture' 'description: Fixture installer skill.' '---' > "$HOME/.config/opencode/skills/fixture/SKILL.md"
`,
    );
    await chmod(join(source, "setup-test"), 0o755);
    await git(source, "init");
    await git(source, "config", "user.name", "OpenCode Manager Test");
    await git(source, "config", "user.email", "test@example.com");
    await git(source, "remote", "add", "origin", "https://github.com/example/fixture-installer.git");
    await git(source, "add", "setup-test");
    await git(source, "commit", "-m", "fixture installer");
    const revision = await git(source, "rev-parse", "HEAD");
    const revisionSource = join(dataRoot, "installers", "fixture-installer", revision);
    await mkdir(join(dataRoot, "installers", "fixture-installer"), { recursive: true });
    await rename(source, revisionSource);

    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.installers = {
      "fixture-installer": {
        type: "git",
        title: "Fixture Installer",
        description: "Installs a fixture skill globally.",
        tags: ["test"],
        repository: "https://github.com/example/fixture-installer.git",
        revision,
        install: ["setup-test"],
        cleanup: [{ directory: ".config/opencode/skills", prefix: "fixture" }],
        marker: ".config/opencode/skills/fixture/SKILL.md",
      },
    };
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    const installerOptions = { ...value.options, installerDataRoot: dataRoot, installerHome: home };
    const preexisting = join(home, ".config", "opencode", "skills", "fixture-personal");
    await mkdir(preexisting, { recursive: true });
    await writeFile(join(preexisting, "keep.txt"), "keep\n");

    expect(await listInstallers(installerOptions)).toMatchObject([{ id: "fixture-installer", status: "absent" }]);
    expect(await setInstallerEnabled(installerOptions, "fixture-installer", true)).toMatchObject({
      installed: true,
      status: "managed",
    });
    const managedMarker = join(home, ".config", "opencode", "skills", "fixture", "SKILL.md");
    expect(await exists(managedMarker)).toBe(true);
    const managedMarkerContent = await readFile(managedMarker, "utf8");
    await writeFile(managedMarker, "replaced externally\n");
    expect(await listInstallers(installerOptions)).toMatchObject([
      { id: "fixture-installer", ownership: "external", status: "conflict" },
    ]);
    await expect(setInstallerEnabled(installerOptions, "fixture-installer", false)).rejects.toThrow(
      "marker was replaced externally",
    );
    await writeFile(managedMarker, managedMarkerContent);
    const config = join(home, ".config");
    const outsideConfig = join(value.root, "outside-config");
    await rename(config, outsideConfig);
    await symlink(outsideConfig, config);
    await expect(setInstallerEnabled(installerOptions, "fixture-installer", false)).rejects.toThrow(
      "cleanup directory escapes HOME",
    );
    await rm(config, { force: true });
    await rename(outsideConfig, config);

    const failingSource = join(value.root, "fixture-installer-failing");
    await git(value.root, "clone", revisionSource, failingSource);
    await git(failingSource, "config", "user.name", "OpenCode Manager Test");
    await git(failingSource, "config", "user.email", "test@example.com");
    await git(failingSource, "remote", "set-url", "origin", "https://github.com/example/fixture-installer.git");
    await writeFile(join(failingSource, "setup-test"), "#!/bin/sh\nexit 1\n");
    await chmod(join(failingSource, "setup-test"), 0o755);
    await git(failingSource, "add", "setup-test");
    await git(failingSource, "commit", "-m", "failing update");
    const failingRevision = await git(failingSource, "rev-parse", "HEAD");
    await rename(failingSource, join(dataRoot, "installers", "fixture-installer", failingRevision));
    catalog.installers["fixture-installer"].revision = failingRevision;
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    await expect(setInstallerEnabled(installerOptions, "fixture-installer", true)).rejects.toThrow(
      "Installer command setup-test failed",
    );
    expect(
      JSON.parse(await readFile(join(dataRoot, "installers-state.json"), "utf8")).installers["fixture-installer"].entry
        .revision,
    ).toBe(revision);
    expect(await listInstallers(installerOptions)).toMatchObject([
      { id: "fixture-installer", installed: true, ownership: "manager", status: "modified" },
    ]);

    const removedRegistryEntry = catalog.installers["fixture-installer"];
    delete catalog.installers["fixture-installer"];
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    expect(await setInstallerEnabled(installerOptions, "fixture-installer", false)).toMatchObject({
      installed: false,
      ownership: "absent",
      status: "absent",
    });
    expect(await exists(join(preexisting, "keep.txt"))).toBe(true);
    await expect(setInstallerEnabled(installerOptions, "fixture-installer", false)).rejects.toThrow("is not managed");

    catalog.installers["fixture-installer"] = removedRegistryEntry;
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    const marker = join(home, ".config", "opencode", "skills", "fixture", "SKILL.md");
    await mkdir(join(home, ".config", "opencode", "skills", "fixture"), { recursive: true });
    await writeFile(marker, "external fixture\n");
    expect(await listInstallers(installerOptions)).toMatchObject([
      { id: "fixture-installer", installed: true, ownership: "external", status: "conflict" },
    ]);
    await expect(setInstallerEnabled(installerOptions, "fixture-installer", true)).rejects.toThrow(
      "conflicts with an external installation",
    );
    await expect(setInstallerEnabled(installerOptions, "fixture-installer", false)).rejects.toThrow("is not managed");
  });

  test("rejects installer cleanup paths that normalize to HOME", async () => {
    const value = await fixture();
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    for (const directory of ["./", "child/.."] as const) {
      catalog.installers = {
        dangerous: {
          type: "git",
          title: "Dangerous",
          description: "Invalid cleanup fixture.",
          tags: [],
          repository: "https://github.com/example/dangerous.git",
          revision: "a".repeat(40),
          install: ["setup"],
          cleanup: [{ directory, prefix: "projects" }],
          marker: ".config/opencode/skills/dangerous/SKILL.md",
        },
      };
      await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
      await expect(loadCatalog({ catalogPath: value.catalogPath })).rejects.toThrow("cleanup 0 is invalid");
    }
  });

  test("keeps a partial fresh installer manager-owned and removable", async () => {
    const value = await fixture();
    const dataRoot = join(value.root, "partial-data");
    const home = join(value.root, "partial-home");
    const source = join(value.root, "partial-source");
    await mkdir(source, { recursive: true });
    await writeFile(
      join(source, "setup-test"),
      `#!/bin/sh
set -eu
mkdir -p "$HOME/.config/opencode/skills/partial"
printf 'partial\n' > "$HOME/.config/opencode/skills/partial/SKILL.md"
exit 1
`,
    );
    await chmod(join(source, "setup-test"), 0o755);
    await git(source, "init");
    await git(source, "config", "user.name", "OpenCode Manager Test");
    await git(source, "config", "user.email", "test@example.com");
    await git(source, "remote", "add", "origin", "https://github.com/example/partial.git");
    await git(source, "add", "setup-test");
    await git(source, "commit", "-m", "partial installer");
    const revision = await git(source, "rev-parse", "HEAD");
    const target = join(dataRoot, "installers", "partial", revision);
    await mkdir(join(dataRoot, "installers", "partial"), { recursive: true });
    await rename(source, target);

    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.installers = {
      partial: {
        type: "git",
        title: "Partial",
        description: "Partial installer fixture.",
        tags: ["test"],
        repository: "https://github.com/example/partial.git",
        revision,
        install: ["setup-test"],
        cleanup: [{ directory: ".config/opencode/skills", prefix: "partial" }],
        marker: ".config/opencode/skills/partial/SKILL.md",
      },
    };
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    const options = { ...value.options, installerDataRoot: dataRoot, installerHome: home };

    await expect(setInstallerEnabled(options, "partial", true)).rejects.toThrow("Installer command setup-test failed");
    expect(await listInstallers(options)).toMatchObject([
      { id: "partial", installed: true, ownership: "manager", status: "modified" },
    ]);
    expect(await setInstallerEnabled(options, "partial", false)).toMatchObject({
      installed: false,
      ownership: "absent",
      status: "absent",
    });
  });

  test("uses a fresh synced registry snapshot without network access", async () => {
    const value = await fixture();
    const cacheRoot = join(value.root, "registry-cache");
    const sourceKey = sha256("https://github.com/nguyenthdat/opencode-manager.git\0main").slice(0, 24);
    const syncDir = join(cacheRoot, sourceKey);
    const working = join(syncDir, "working");
    const registry = join(working, "registry");
    const skill = join(registry, "skills", "fixture");
    await mkdir(skill, { recursive: true });
    await writeFile(join(skill, "SKILL.md"), "---\nname: fixture\ndescription: Synced fixture skill.\n---\n");
    await writeFile(
      join(registry, "catalog.jsonc"),
      JSON.stringify({
        version: 1,
        mcps: {},
        plugins: {},
        installers: {},
        skillSources: { custom: { type: "local", title: "Custom", path: "skills", skillsPath: "." } },
        rules: {},
        agents: {},
        profiles: [],
      }),
    );
    await git(working, "init");
    await git(working, "config", "user.name", "OpenCode Manager Test");
    await git(working, "config", "user.email", "test@example.com");
    await git(working, "remote", "add", "origin", "https://github.com/nguyenthdat/opencode-manager.git");
    await git(working, "add", "registry");
    await git(working, "commit", "-m", "registry snapshot");
    const revision = await git(working, "rev-parse", "HEAD");
    const snapshot = join(syncDir, "snapshots", revision);
    await mkdir(join(syncDir, "snapshots"), { recursive: true });
    await rename(working, snapshot);
    await writeFile(
      join(syncDir, "current.json"),
      JSON.stringify({
        repository: "https://github.com/nguyenthdat/opencode-manager.git",
        ref: "main",
        revision,
        checkedAt: Date.now(),
      }),
    );

    const result = await syncRegistry({ projectRoot: value.projectRoot }, { cacheRoot });
    expect(result).toEqual({
      catalogPath: join(await realpath(snapshot), "registry", "catalog.jsonc"),
      revision,
      status: "current",
    });
  });

  test("updates duplicate-repository revisions once while preserving JSONC comments", async () => {
    const root = await mkdtemp(join(tmpdir(), "opencode-manager-update-test-"));
    temporaryRoots.push(root);
    const catalogPath = join(root, "catalog.jsonc");
    const previous = "a".repeat(40);
    const revision = "b".repeat(40);
    await writeFile(
      catalogPath,
      `{
  "version": 1,
  "mcps": {},
  "plugins": {},
  "skillSources": {
    // keep this source comment
    "one": {
      "type": "git",
      "title": "One",
      "repository": "https://github.com/example/skills.git",
      "revision": "${previous}",
      "skillsPath": "skills"
    },
    "two": {
      "type": "git",
      "title": "Two",
      "repository": "https://github.com/example/skills.git",
      "revision": "${previous}",
      "skillsPath": "other-skills"
    }
  },
  "profiles": []
}
`,
    );
    let resolutions = 0;
    const changes = await updateSkillSourceRevisions({
      catalogPath,
      resolveRevision: async () => {
        resolutions += 1;
        return revision.toUpperCase();
      },
    });

    expect(resolutions).toBe(1);
    expect(changes.map((change) => change.id)).toEqual(["one", "two"]);
    const source = await readFile(catalogPath, "utf8");
    expect(source).toContain("// keep this source comment");
    const catalog = parse(source);
    expect(catalog.skillSources.one.revision).toBe(revision);
    expect(catalog.skillSources.two.revision).toBe(revision);
  });

  test("treats constructor as a normal absent resource id", async () => {
    const value = await fixture();
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.rules.constructor = {
      title: "Constructor Rule",
      description: "Prototype-sensitive rule id fixture.",
      tags: ["test"],
      path: "rules/fixture-rule.md",
    };
    catalog.agents.constructor = {
      type: "single",
      title: "Constructor Agent",
      description: "Prototype-sensitive agent id fixture.",
      tags: ["test"],
      path: "agents/fixture-agent.md",
    };
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    expect((await listRules(value.options)).find((item) => item.id === "constructor")?.status).toBe("absent");
    expect((await listAgents(value.options)).find((item) => item.id === "constructor")?.status).toBe("absent");
  });

  test("discovers every bundled custom skill with valid metadata", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "opencode-manager-bundled-skills-"));
    temporaryRoots.push(projectRoot);
    const skills = await listSkills({ projectRoot }, "custom");
    expect(skills).toHaveLength(28);
    expect(new Set(skills.map((skill) => skill.name)).size).toBe(28);
    expect(skills.every((skill) => skill.description.length > 0 && skill.description.length <= 1024)).toBe(true);
    expect(skills.every((skill) => skill.status === "absent")).toBe(true);
  });

  test("discovers bundled rules, standalone agents, and folder-based teams", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "opencode-manager-bundled-agents-"));
    temporaryRoots.push(projectRoot);
    const [rules, agents] = await Promise.all([listRules({ projectRoot }), listAgents({ projectRoot })]);
    expect(rules.map((rule) => rule.id)).toEqual(["codebase-memory", "parallel-agents"]);
    expect(agents.map((agent) => agent.id)).toEqual(["search", "software-architect", "researcher", "review-team"]);
    expect(agents.find((agent) => agent.id === "researcher")).toMatchObject({ type: "team", members: 6 });
    expect(agents.find((agent) => agent.id === "review-team")).toMatchObject({ type: "team", members: 3 });
    expect(agents.filter((agent) => agent.type === "single").every((agent) => agent.members === 1)).toBe(true);
    const researchOrchestrator = await readFile(
      join(import.meta.dir, "..", "registry", "agents", "researcher", "research.md"),
      "utf8",
    );
    expect(researchOrchestrator).toContain('"researcher/research-web": allow');
  });

  test("loads rule and agent state from projects created before those registries existed", async () => {
    const value = await fixture();
    const managerDir = join(value.projectRoot, ".opencode", ".opencode-manager");
    await mkdir(managerDir, { recursive: true });
    await writeFile(join(managerDir, "state.json"), `{"version":1,"mcps":{},"skills":{}}\n`);
    const [rules, agents] = await Promise.all([listRules(value.options), listAgents(value.options)]);
    expect(rules.every((rule) => rule.status === "absent")).toBe(true);
    expect(agents.every((agent) => agent.status === "absent")).toBe(true);
  });

  test("migrates digest-only rule and agent state", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    const managerDir = join(configDir, ".opencode-manager");
    const rule = await readFile(join(value.registry, "rules", "fixture-rule.md"), "utf8");
    const agent = await readFile(join(value.registry, "agents", "fixture-agent.md"), "utf8");
    await Promise.all([
      mkdir(join(configDir, "instructions"), { recursive: true }),
      mkdir(join(configDir, "agents"), { recursive: true }),
      mkdir(join(configDir, "agents", "fixture-agent"), { recursive: true }),
      mkdir(managerDir, { recursive: true }),
    ]);
    await writeFile(join(configDir, "instructions", "fixture-rule.md"), rule);
    await writeFile(join(configDir, "agents", "fixture-agent.md"), agent);
    await writeFile(join(configDir, "agents", "fixture-agent", "member.md"), "unrelated nested agent\n");
    await writeFile(join(configDir, "opencode.jsonc"), `{"share":"disabled"}\n`);
    await writeFile(
      join(value.projectRoot, "opencode.jsonc"),
      `{"instructions":[".opencode/instructions/fixture-rule.md"]}\n`,
    );
    await writeFile(
      join(managerDir, "state.json"),
      `${JSON.stringify({
        version: 1,
        mcps: {},
        skills: {},
        rules: { "fixture-rule": { digest: sha256(rule) } },
        agents: { "fixture-agent": { digest: sha256(agent) } },
      })}\n`,
    );
    expect((await listRules(value.options))[0]?.status).toBe("managed");
    expect((await listAgents(value.options)).find((item) => item.id === "fixture-agent")?.status).toBe("managed");
    await setAgentEnabled(value.options, "fixture-agent", false);
    expect(await exists(join(configDir, "agents", "fixture-agent.md"))).toBe(false);
    expect(await exists(join(configDir, "agents", "fixture-agent", "member.md"))).toBe(true);
  });
});

describe("project MCP registry", () => {
  test("writes a full definition project-locally and preserves unrelated JSONC", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, "opencode.jsonc"),
      `{
  // keep this project setting
  "$schema": "https://opencode.ai/config.json",
  "share": "disabled",
}
`,
    );

    const enabled = await setMcpEnabled(value.options, "docs", true);
    expect(enabled.enabled).toBe(true);
    expect(enabled.ownership).toBe("manager");
    const source = await readFile(join(configDir, "opencode.jsonc"), "utf8");
    expect(source).toContain("// keep this project setting");
    const config = parse(source);
    expect(config.share).toBe("disabled");
    expect(config.mcp.docs.url).toBe("https://example.com/mcp");
    expect(config.mcp.docs.enabled).toBe(true);

    const disabled = await setMcpEnabled(value.options, "docs", false);
    expect(disabled.enabled).toBe(false);
    expect(parse(await readFile(join(configDir, "opencode.jsonc"), "utf8")).mcp.docs.enabled).toBe(false);
  });

  test("patches an existing root config instead of creating a second config", async () => {
    const value = await fixture();
    const rootConfig = join(value.projectRoot, "opencode.jsonc");
    await writeFile(
      rootConfig,
      `{
  // existing root config
  "$schema": "https://opencode.ai/config.json",
  "share": "manual"
}
`,
    );

    await setMcpEnabled(value.options, "docs", true);
    const source = await readFile(rootConfig, "utf8");
    expect(source).toContain("// existing root config");
    expect(parse(source).mcp.docs.enabled).toBe(true);
    expect(await exists(join(value.projectRoot, ".opencode", "opencode.jsonc"))).toBe(false);
  });

  test("refuses to enable a same-name divergent project MCP", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    const original = `{"share":"disabled","mcp":{"docs":{"type":"local","command":["unexpected"]}}}\n`;
    await writeFile(join(configDir, "opencode.jsonc"), original);

    await expect(setMcpEnabled(value.options, "docs", true)).rejects.toThrow("conflicts with the registry definition");
    expect(await readFile(join(configDir, "opencode.jsonc"), "utf8")).toBe(original);
    expect((await listMcps(value.options))[0]?.status).toBe("conflict");

    const overridden = await setMcpEnabled(value.options, "docs", true, { override: true });
    expect(overridden.status).toBe("enabled");
    expect(overridden.ownership).toBe("manager");
    const config = parse(await readFile(join(configDir, "opencode.jsonc"), "utf8"));
    expect(config.share).toBe("disabled");
    expect(config.mcp.docs.type).toBe("remote");
    const backups = await readdir(join(configDir, ".opencode-manager", "backups", "mcps"));
    expect(backups.some((name) => name.startsWith("docs-"))).toBe(true);
  });

  test("uses an enabled-only override for an exact inherited MCP", async () => {
    const value = await fixture();
    const catalog = await loadCatalog({ catalogPath: value.catalogPath });
    const inherited = new Proxy(
      {
        ...catalog.mcps.docs?.config,
        headers: new Proxy({ Authorization: "Bearer resolved-secret\nsecond-line" }, {}),
        enabled: false,
      },
      {},
    );
    const options = { ...value.options, effectiveMcp: { docs: inherited } };
    await setMcpEnabled(options, "docs", true);
    const config = parse(await readFile(join(value.projectRoot, ".opencode", "opencode.jsonc"), "utf8"));
    expect(config.mcp.docs).toEqual({ enabled: true });
  });

  test("marks an orphaned enabled-only override as a conflict", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    await writeFile(join(configDir, "opencode.jsonc"), `{"mcp":{"docs":{"enabled":true}}}\n`);
    expect((await listMcps(value.options))[0]?.status).toBe("conflict");
  });

  test("recovers a lock left by a dead process", async () => {
    const value = await fixture();
    const managerDir = join(value.projectRoot, ".opencode", ".opencode-manager");
    await mkdir(managerDir, { recursive: true });
    await writeFile(join(managerDir, "manager.lock"), "999999999\n0\n");
    expect((await setMcpEnabled(value.options, "docs", true)).enabled).toBe(true);
  });

  test("does not steal an old lock from a live process", async () => {
    const value = await fixture();
    const managerDir = join(value.projectRoot, ".opencode", ".opencode-manager");
    const lock = join(managerDir, "manager.lock");
    await mkdir(managerDir, { recursive: true });
    await writeFile(lock, `${process.pid}\n0\n`);
    const started = Date.now();
    const release = setTimeout(() => void unlink(lock).catch(() => undefined), 100);
    try {
      expect((await setMcpEnabled(value.options, "docs", true)).enabled).toBe(true);
    } finally {
      clearTimeout(release);
    }
    expect(Date.now() - started).toBeGreaterThanOrEqual(50);
  });

  test("rejects a backup directory symlink before overriding an MCP", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    const managerDir = join(configDir, ".opencode-manager");
    const outside = join(value.root, "outside-backups");
    await Promise.all([mkdir(managerDir, { recursive: true }), mkdir(outside)]);
    await symlink(outside, join(managerDir, "backups"));
    await writeFile(join(configDir, "opencode.jsonc"), `{"mcp":{"docs":{"type":"local","command":["unexpected"]}}}\n`);

    await expect(setMcpEnabled(value.options, "docs", true, { override: true })).rejects.toThrow(
      "backup directory changed or escapes",
    );
    expect(await readdir(outside)).toHaveLength(0);
  });
});

describe("project plugin registry", () => {
  test("adds and removes one package while preserving unrelated JSONC", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    const configFile = join(configDir, "opencode.jsonc");
    await mkdir(configDir, { recursive: true });
    await writeFile(
      configFile,
      `{
  // keep this project setting
  "share": "manual",
  "plugin": [
    // keep this unrelated plugin
    "existing-plugin",
  ],
}
`,
    );

    const enabled = await setPluginEnabled(value.options, "fixture", true);
    expect(enabled).toMatchObject({ enabled: true, status: "enabled", ownership: "manager" });
    let source = await readFile(configFile, "utf8");
    expect(source).toContain("// keep this project setting");
    expect(source).toContain("// keep this unrelated plugin");
    expect(parse(source).plugin).toEqual(["existing-plugin", "@fixture/opencode"]);

    const disabled = await setPluginEnabled(value.options, "fixture", false);
    expect(disabled).toMatchObject({ enabled: false, status: "absent", ownership: "absent" });
    source = await readFile(configFile, "utf8");
    expect(source).toContain("// keep this unrelated plugin");
    expect(parse(source).plugin).toEqual(["existing-plugin"]);
  });

  test("reports inherited plugins and refuses to disable them project-locally", async () => {
    const value = await fixture();
    const options = { ...value.options, effectivePlugin: ["@fixture/opencode"] };
    expect((await listPlugins(options))[0]).toMatchObject({
      enabled: true,
      status: "enabled",
      ownership: "inherited",
    });
    await expect(setPluginEnabled(options, "fixture", false)).rejects.toThrow("cannot be disabled from this project");
    await setPluginEnabled(options, "fixture", true);
    expect(await exists(join(value.projectRoot, ".opencode", "opencode.jsonc"))).toBe(false);
  });

  test("backs up a configured package before an approved replacement", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, "opencode.jsonc"),
      `${JSON.stringify({ plugin: [["@fixture/opencode", { mode: "custom" }], "existing-plugin"] }, null, 2)}\n`,
    );

    expect((await listPlugins(value.options))[0]?.status).toBe("conflict");
    await expect(setPluginEnabled(value.options, "fixture", true)).rejects.toThrow(
      "conflicts with the registry package",
    );
    const enabled = await setPluginEnabled(value.options, "fixture", true, { override: true });
    expect(enabled).toMatchObject({ status: "enabled", ownership: "manager" });
    const config = parse(await readFile(join(configDir, "opencode.jsonc"), "utf8"));
    expect(config.plugin).toEqual(["existing-plugin", "@fixture/opencode"]);
    const backups = await readdir(join(configDir, ".opencode-manager", "backups", "plugins"));
    expect(backups.some((name) => name.startsWith("fixture-"))).toBe(true);
  });

  test("replaces the previously managed package when a registry entry changes", async () => {
    const value = await fixture();
    await setPluginEnabled(value.options, "fixture", true);
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.plugins.fixture.package = "@fixture/opencode-next";
    await writeFile(value.catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

    expect((await listPlugins(value.options))[0]).toMatchObject({ enabled: true, status: "conflict" });
    await expect(setPluginEnabled(value.options, "fixture", true)).rejects.toThrow(
      "modified after manager installation",
    );
    const updated = await setPluginEnabled(value.options, "fixture", true, { override: true });
    expect(updated).toMatchObject({ enabled: true, status: "enabled", ownership: "manager" });
    const config = parse(await readFile(join(value.projectRoot, ".opencode", "opencode.jsonc"), "utf8"));
    expect(config.plugin).toEqual(["@fixture/opencode-next"]);
  });

  test("rejects malformed project plugin entries", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    await writeFile(join(configDir, "opencode.jsonc"), `{"plugin":[42]}\n`);
    await expect(listPlugins(value.options)).rejects.toThrow("package strings or [package, options] tuples");
  });
});

describe("project skill registry", () => {
  test("installs a complete bundle and protects local modifications", async () => {
    const value = await fixture();
    const before = await listSkills(value.options, "custom");
    expect(before).toHaveLength(1);
    expect(before[0]?.nestedSkills).toBe(1);
    expect(before[0]?.status).toBe("absent");

    const installed = await setSkillEnabled(value.options, "custom", "fixture-skill", true);
    expect(installed.status).toBe("managed");
    const destination = join(value.projectRoot, ".opencode", "skills", "fixture-skill");
    expect(await readFile(join(destination, "reference.txt"), "utf8")).toBe("registry asset\n");
    expect(await readFile(join(destination, "nested", "SKILL.md"), "utf8")).toContain("nested-skill");

    await writeFile(join(destination, "reference.txt"), "project edit\n");
    await expect(setSkillEnabled(value.options, "custom", "fixture-skill", false)).rejects.toThrow(
      "Refusing to disable modified skill",
    );
    expect((await listSkills(value.options, "custom"))[0]?.status).toBe("modified");

    await setSkillEnabled(value.options, "custom", "fixture-skill", false, { override: true });
    expect(await exists(destination)).toBe(false);
    const disabled = await readdir(
      join(value.projectRoot, ".opencode", ".opencode-manager", "backups", "skills", "disabled"),
    );
    expect(disabled.some((name) => name.startsWith("fixture-skill-"))).toBe(true);
  });

  test("asks before overriding an unmanaged skill and preserves the original", async () => {
    const value = await fixture();
    const destination = join(value.projectRoot, ".opencode", "skills", "fixture-skill");
    await mkdir(destination, { recursive: true });
    await writeFile(join(destination, "SKILL.md"), "user-owned skill\n");
    await expect(setSkillEnabled(value.options, "custom", "fixture-skill", true)).rejects.toThrow("confirm override");

    await setSkillEnabled(value.options, "custom", "fixture-skill", true, { override: true });
    expect(await readFile(join(destination, "reference.txt"), "utf8")).toBe("registry asset\n");
    const backupRoot = join(value.projectRoot, ".opencode", ".opencode-manager", "backups", "skills", "override");
    const backups = await readdir(backupRoot);
    expect(backups).toHaveLength(1);
    expect(await readFile(join(backupRoot, backups[0]!, "SKILL.md"), "utf8")).toBe("user-owned skill\n");
  });

  test("installs and removes every skill in a source as one operation", async () => {
    const value = await fixture();
    const secondSkill = join(value.registry, "skills", "second-skill");
    await mkdir(secondSkill);
    await writeFile(
      join(secondSkill, "SKILL.md"),
      `---\nname: second-skill\ndescription: Use when testing bulk skill source operations.\n---\n\n# Second\n`,
    );

    const installed = await setSkillSourceEnabled(value.options, "custom", true);
    expect(installed.map((skill) => [skill.name, skill.status])).toEqual([
      ["fixture-skill", "managed"],
      ["second-skill", "managed"],
    ]);
    expect(await exists(join(value.projectRoot, ".opencode", "skills", "fixture-skill"))).toBe(true);
    expect(await exists(join(value.projectRoot, ".opencode", "skills", "second-skill"))).toBe(true);

    const removed = await setSkillSourceEnabled(value.options, "custom", false);
    expect(removed.every((skill) => skill.status === "absent")).toBe(true);
    expect(await exists(join(value.projectRoot, ".opencode", "skills", "fixture-skill"))).toBe(false);
    expect(await exists(join(value.projectRoot, ".opencode", "skills", "second-skill"))).toBe(false);
  });

  test("preflights source conflicts before a bulk install", async () => {
    const value = await fixture();
    const secondSkill = join(value.registry, "skills", "second-skill");
    await mkdir(secondSkill);
    await writeFile(
      join(secondSkill, "SKILL.md"),
      `---\nname: second-skill\ndescription: Use when testing bulk conflict handling.\n---\n\n# Second\n`,
    );
    const conflict = join(value.projectRoot, ".opencode", "skills", "fixture-skill");
    await mkdir(conflict, { recursive: true });
    await writeFile(join(conflict, "SKILL.md"), "user-owned skill\n");

    await expect(setSkillSourceEnabled(value.options, "custom", true)).rejects.toThrow("confirm override");
    expect(await exists(join(value.projectRoot, ".opencode", "skills", "second-skill"))).toBe(false);

    const installed = await setSkillSourceEnabled(value.options, "custom", true, { override: true });
    expect(installed.every((skill) => skill.status === "managed")).toBe(true);
    const backups = await readdir(
      join(value.projectRoot, ".opencode", ".opencode-manager", "backups", "skills", "override"),
    );
    expect(backups.some((name) => name.startsWith("fixture-skill-"))).toBe(true);
  });

  test("rejects symlinks in a skill source", async () => {
    const value = await fixture();
    await symlink(join(value.root, "outside"), join(value.registry, "skills", "linked"));
    await expect(listSkills(value.options, "custom")).rejects.toThrow("contains symlink");
  });

  test("skips source-level symlink mirrors only when explicitly configured", async () => {
    const value = await fixture();
    await symlink(join(value.root, "outside"), join(value.registry, "skills", "linked"));
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.skillSources.custom.ignoreSymlinks = true;
    await writeFile(value.catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
    const skills = await listSkills(value.options, "custom");
    expect(skills.map((skill) => skill.name)).toEqual(["fixture-skill"]);
  });

  test("rejects a project skills directory that escapes through a symlink", async () => {
    const value = await fixture();
    const outside = join(value.root, "outside-skills");
    const configDir = join(value.projectRoot, ".opencode");
    await Promise.all([mkdir(outside), mkdir(configDir)]);
    await symlink(outside, join(configDir, "skills"));
    await expect(listSkills(value.options, "custom")).rejects.toThrow("Managed project paths must stay inside");
  });

  test("rejects a local skill registry root that escapes through a symlink", async () => {
    const value = await fixture();
    const outside = join(value.root, "outside-registry");
    await mkdir(outside);
    await symlink(outside, join(value.registry, "linked-skills"));
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.skillSources.custom.path = "linked-skills";
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    await expect(listSkills(value.options, "custom")).rejects.toThrow("escapes the registry root");
  });
});

describe("project rule registry", () => {
  test("installs an instruction reference and archives a modified rule on confirmed disable", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    await writeFile(
      join(configDir, "opencode.jsonc"),
      `{
  // preserve unrelated project instructions
  "instructions": ["docs/project.md"],
  "share": "manual"
}
`,
    );

    expect((await listRules(value.options))[0]).toMatchObject({ id: "fixture-rule", status: "absent" });
    const installed = await setRuleEnabled(value.options, "fixture-rule", true);
    expect(installed).toMatchObject({ status: "managed", ownership: "manager" });
    const ruleFile = join(configDir, "instructions", "fixture-rule.md");
    expect(await readFile(ruleFile, "utf8")).toContain("Keep fixture behavior deterministic");
    let config = parse(await readFile(join(configDir, "opencode.jsonc"), "utf8"));
    expect(config.instructions).toEqual(["docs/project.md", ".opencode/instructions/fixture-rule.md"]);
    expect(config.share).toBe("manual");

    await writeFile(
      join(configDir, "opencode.jsonc"),
      `${JSON.stringify({ instructions: ["docs/project.md"], share: "manual" }, null, 2)}\n`,
    );
    expect((await listRules(value.options))[0]?.status).toBe("modified");
    await expect(setRuleEnabled(value.options, "fixture-rule", false)).rejects.toThrow(
      "instruction reference was modified",
    );
    await setRuleEnabled(value.options, "fixture-rule", true, { override: true });

    await writeFile(ruleFile, "project-modified rule\n");
    await expect(setRuleEnabled(value.options, "fixture-rule", false)).rejects.toThrow("modified rule");
    await setRuleEnabled(value.options, "fixture-rule", false, { override: true });
    expect(await exists(ruleFile)).toBe(false);
    config = parse(await readFile(join(configDir, "opencode.jsonc"), "utf8"));
    expect(config.instructions).toEqual(["docs/project.md"]);
    const backups = await readdir(join(configDir, ".opencode-manager", "backups", "rules", "disabled"));
    expect(backups).toHaveLength(1);
  });

  test("removes a rule from the config it originally patched when config precedence changes", async () => {
    const value = await fixture();
    const rootConfig = join(value.projectRoot, "opencode.jsonc");
    await writeFile(rootConfig, `{"share":"manual"}\n`);
    await setRuleEnabled(value.options, "fixture-rule", true);
    expect(parse(await readFile(rootConfig, "utf8")).instructions).toEqual([".opencode/instructions/fixture-rule.md"]);

    const nestedConfig = join(value.projectRoot, ".opencode", "opencode.jsonc");
    await writeFile(nestedConfig, `{"share":"disabled"}\n`);
    await setRuleEnabled(value.options, "fixture-rule", false);
    expect(parse(await readFile(rootConfig, "utf8")).instructions).toEqual([]);
    expect(parse(await readFile(nestedConfig, "utf8")).instructions).toBeUndefined();
  });

  test("preserves comments inside an existing instructions array", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    const configFile = join(configDir, "opencode.jsonc");
    await writeFile(
      configFile,
      `{
  "instructions": [
    // keep this project instruction
    "docs/project.md",
  ],
}
`,
    );
    await setRuleEnabled(value.options, "fixture-rule", true);
    await setRuleEnabled(value.options, "fixture-rule", false);
    const source = await readFile(configFile, "utf8");
    expect(source).toContain("// keep this project instruction");
    expect(parse(source).instructions).toEqual(["docs/project.md"]);
  });

  test("can disable a managed rule after its registry source disappears", async () => {
    const value = await fixture();
    await setRuleEnabled(value.options, "fixture-rule", true);
    await rm(join(value.registry, "rules", "fixture-rule.md"));
    expect((await listRules(value.options))[0]?.status).toBe("modified");
    const disabled = await setRuleEnabled(value.options, "fixture-rule", false);
    expect(disabled.status).toBe("absent");
  });

  test("rejects a state-controlled config path outside supported OpenCode config files", async () => {
    const value = await fixture();
    await setRuleEnabled(value.options, "fixture-rule", true);
    const packageFile = join(value.projectRoot, "package.json");
    const packageSource = `{"name":"fixture","instructions":[".opencode/instructions/fixture-rule.md"]}\n`;
    await writeFile(packageFile, packageSource);
    const stateFile = join(value.projectRoot, ".opencode", ".opencode-manager", "state.json");
    const state = JSON.parse(await readFile(stateFile, "utf8"));
    state.rules["fixture-rule"].configFile = "package.json";
    await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);
    await expect(listRules(value.options)).rejects.toThrow("not a supported OpenCode project config");
    expect(await readFile(packageFile, "utf8")).toBe(packageSource);
  });

  test("rejects a symlinked project config before mutating rule resources", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    await mkdir(configDir, { recursive: true });
    const target = join(value.projectRoot, "config-target.jsonc");
    const source = `{"share":"manual"}\n`;
    await writeFile(target, source);
    await symlink(target, join(configDir, "opencode.jsonc"));
    await expect(setRuleEnabled(value.options, "fixture-rule", true)).rejects.toThrow("regular non-symlink file");
    expect(await readFile(target, "utf8")).toBe(source);
    expect(await exists(join(configDir, "instructions", "fixture-rule.md"))).toBe(false);
  });
});

describe("project agent registry", () => {
  test("installs standalone agents and complete folder-based teams", async () => {
    const value = await fixture();
    const before = await listAgents(value.options);
    expect(before.find((agent) => agent.id === "fixture-agent")).toMatchObject({
      type: "single",
      members: 1,
      status: "absent",
    });
    expect(before.find((agent) => agent.id === "fixture-team")).toMatchObject({
      type: "team",
      members: 2,
      status: "absent",
    });

    await setAgentEnabled(value.options, "fixture-agent", true);
    const team = await setAgentEnabled(value.options, "fixture-team", true);
    expect(team).toMatchObject({ status: "managed", type: "team", members: 2 });
    const agentsDir = join(value.projectRoot, ".opencode", "agents");
    expect(await readFile(join(agentsDir, "fixture-agent.md"), "utf8")).toContain("Fixture Agent");
    expect(await readFile(join(agentsDir, "fixture-team", "lead.md"), "utf8")).toContain("# Lead");
    expect(await readFile(join(agentsDir, "fixture-team", "reviewer.md"), "utf8")).toContain("# Reviewer");

    await writeFile(join(agentsDir, "fixture-team", "reviewer.md"), "project edit\n");
    await expect(setAgentEnabled(value.options, "fixture-team", false)).rejects.toThrow("modified agent resource");
    await setAgentEnabled(value.options, "fixture-team", false, { override: true });
    expect(await exists(join(agentsDir, "fixture-team"))).toBe(false);
    const backups = await readdir(
      join(value.projectRoot, ".opencode", ".opencode-manager", "backups", "agents", "disabled"),
    );
    expect(backups).toHaveLength(1);
  });

  test("requires confirmation before shadowing an inherited same-name agent", async () => {
    const value = await fixture();
    const options = { ...value.options, effectiveAgent: { "fixture-agent": { description: "global agent" } } };
    expect((await listAgents(options)).find((agent) => agent.id === "fixture-agent")).toMatchObject({
      status: "conflict",
      ownership: "inherited",
    });
    await expect(setAgentEnabled(options, "fixture-agent", true)).rejects.toThrow("inherited same-name agent");
    const installed = await setAgentEnabled(options, "fixture-agent", true, { override: true });
    expect(installed).toMatchObject({ status: "managed", ownership: "manager" });
  });

  test("does not treat a standalone inherited name as a team-member conflict", async () => {
    const value = await fixture();
    const exact = { ...value.options, effectiveAgent: { "fixture-team": { description: "standalone" } } };
    expect((await listAgents(exact)).find((agent) => agent.id === "fixture-team")).toMatchObject({
      status: "absent",
      ownership: "absent",
    });
    const nested = { ...value.options, effectiveAgent: { "fixture-team/lead": { description: "nested" } } };
    expect((await listAgents(nested)).find((agent) => agent.id === "fixture-team")).toMatchObject({
      status: "conflict",
      ownership: "inherited",
    });
  });

  test("archives the old destination when an agent changes between single and team", async () => {
    const value = await fixture();
    const agentsDir = join(value.projectRoot, ".opencode", "agents");
    await setAgentEnabled(value.options, "fixture-agent", true);
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    catalog.agents["fixture-agent"].type = "team";
    catalog.agents["fixture-agent"].path = "agents/fixture-team";
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    expect((await listAgents(value.options)).find((agent) => agent.id === "fixture-agent")?.status).toBe("modified");
    await expect(setAgentEnabled(value.options, "fixture-agent", true)).rejects.toThrow("changed registry type");
    await setAgentEnabled(value.options, "fixture-agent", true, { override: true });
    expect(await exists(join(agentsDir, "fixture-agent.md"))).toBe(false);
    expect(await exists(join(agentsDir, "fixture-agent", "lead.md"))).toBe(true);

    catalog.agents["fixture-agent"].type = "single";
    catalog.agents["fixture-agent"].path = "agents/fixture-agent.md";
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));
    await setAgentEnabled(value.options, "fixture-agent", true, { override: true });
    expect(await exists(join(agentsDir, "fixture-agent"))).toBe(false);
    expect(await exists(join(agentsDir, "fixture-agent.md"))).toBe(true);
  });

  test("can disable a managed team after its registry source disappears", async () => {
    const value = await fixture();
    await setAgentEnabled(value.options, "fixture-team", true);
    await rm(join(value.registry, "agents", "fixture-team"), { recursive: true });
    expect((await listAgents(value.options)).find((agent) => agent.id === "fixture-team")?.status).toBe("modified");
    const disabled = await setAgentEnabled(value.options, "fixture-team", false);
    expect(disabled.status).toBe("absent");
  });

  test("rejects malformed known agent frontmatter fields", async () => {
    const value = await fixture();
    const file = join(value.registry, "agents", "fixture-agent.md");
    await writeFile(file, `---\ndescription: Invalid steps fixture.\nmode: subagent\nsteps: many\n---\n\n# Invalid\n`);
    await expect(listAgents(value.options)).rejects.toThrow("steps must be a positive integer");
  });

  test("accepts permission shorthand and rejects pattern maps for action-only permissions", async () => {
    const value = await fixture();
    const file = join(value.registry, "agents", "fixture-agent.md");
    await writeFile(
      file,
      `---\ndescription: Permission shorthand fixture.\nmode: subagent\npermission: deny\n---\n\n# Valid\n`,
    );
    expect((await listAgents(value.options)).find((item) => item.id === "fixture-agent")?.status).toBe("absent");
    await writeFile(
      file,
      `---\ndescription: Invalid permission fixture.\nmode: subagent\npermission:\n  webfetch:\n    "*": allow\n---\n\n# Invalid\n`,
    );
    await expect(listAgents(value.options)).rejects.toThrow('permission for "webfetch" is invalid');
  });

  test("keeps catalog-removed managed rules and agents visible until cleanup", async () => {
    const value = await fixture();
    await setRuleEnabled(value.options, "fixture-rule", true);
    await setAgentEnabled(value.options, "fixture-agent", true);
    const catalog = JSON.parse(await readFile(value.catalogPath, "utf8"));
    delete catalog.rules["fixture-rule"];
    delete catalog.agents["fixture-agent"];
    catalog.profiles[0].rules = [];
    catalog.profiles[0].agents = ["fixture-team"];
    await writeFile(value.catalogPath, JSON.stringify(catalog, null, 2));

    expect((await listRules(value.options)).find((rule) => rule.id === "fixture-rule")?.status).toBe("managed");
    expect((await listAgents(value.options)).find((agent) => agent.id === "fixture-agent")?.status).toBe("managed");
    expect((await setRuleEnabled(value.options, "fixture-rule", false)).status).toBe("absent");
    expect((await setAgentEnabled(value.options, "fixture-agent", false)).status).toBe("absent");
    expect((await listRules(value.options)).some((rule) => rule.id === "fixture-rule")).toBe(false);
    expect((await listAgents(value.options)).some((agent) => agent.id === "fixture-agent")).toBe(false);
  });
});

describe("profiles", () => {
  test("applies and removes a project profile", async () => {
    const value = await fixture();
    const enabled = await setProfileEnabled(value.options, "fixture", true);
    expect(enabled.profile.status).toBe("enabled");
    expect(enabled.mcps[0]?.enabled).toBe(true);
    expect(enabled.skills[0]?.status).toBe("managed");
    expect(enabled.rules[0]?.status).toBe("managed");
    expect(enabled.agents.every((agent) => agent.status === "managed")).toBe(true);
    expect((await listProfiles(value.options))[0]?.enabledResources).toBe(5);

    const disabled = await setProfileEnabled(value.options, "fixture", false);
    expect(disabled.profile.status).toBe("disabled");
    expect(disabled.mcps[0]?.enabled).toBe(false);
    expect(disabled.skills[0]?.status).toBe("absent");
    expect(disabled.rules[0]?.status).toBe("absent");
    expect(disabled.agents.every((agent) => agent.status === "absent")).toBe(true);
    expect((await getProfile(value.options, "fixture")).profile.totalResources).toBe(5);
  });

  test("disabling a never-enabled profile does not create MCP config", async () => {
    const value = await fixture();
    const disabled = await setProfileEnabled(value.options, "fixture", false);
    expect(disabled.profile.status).toBe("disabled");
    expect(await exists(join(value.projectRoot, ".opencode", "opencode.jsonc"))).toBe(false);
  });

  test("reports modified rules and teams as profile conflicts", async () => {
    const value = await fixture();
    await setProfileEnabled(value.options, "fixture", true);
    await writeFile(join(value.projectRoot, ".opencode", "agents", "fixture-team", "reviewer.md"), "project edit\n");
    const profile = (await listProfiles(value.options))[0];
    expect(profile?.status).toBe("conflict");
    expect(profile?.enabledResources).toBe(4);
  });

  test("reports a modified managed skill as a profile conflict", async () => {
    const value = await fixture();
    await setProfileEnabled(value.options, "fixture", true);
    await writeFile(join(value.projectRoot, ".opencode", "skills", "fixture-skill", "reference.txt"), "project edit\n");
    const profile = (await listProfiles(value.options))[0];
    expect(profile?.status).toBe("conflict");
    expect(profile?.enabledResources).toBe(4);
  });
});

test("exports a target-exclusive OpenCode TUI plugin", () => {
  expect(plugin.id).toBe("opencode-manager");
  expect(typeof plugin.tui).toBe("function");
  expect("server" in plugin).toBe(false);
});

test("uses the active directory for OpenCode's non-Git worktree sentinel", () => {
  expect(resolveProjectRoot("/", "/tmp/project")).toBe("/tmp/project");
  expect(resolveProjectRoot("/tmp/worktree", "/tmp/project")).toBe("/tmp/worktree");
});

test("runtime source files are TypeScript-only", async () => {
  const sourceFiles = await readdir(join(import.meta.dir, "..", "src"));
  expect(sourceFiles.some((name) => name.endsWith(".js") || name.endsWith(".jsx"))).toBe(false);
});
