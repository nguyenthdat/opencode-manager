import { afterEach, describe, expect, test } from "bun:test";
import { lstat, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "jsonc-parser";
import plugin, { resolveProjectRoot } from "../src/tui.ts";
import {
  getProfile,
  listMcps,
  listProfiles,
  listSkills,
  loadCatalog,
  setMcpEnabled,
  setProfileEnabled,
  setSkillEnabled,
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
  await Promise.all([
    mkdir(projectRoot, { recursive: true }),
    mkdir(nestedRoot, { recursive: true }),
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
        skillSources: {
          custom: {
            type: "local",
            title: "Custom",
            path: "skills",
            skillsPath: ".",
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
  test("loads the bundled MCP and vendor skill registries", async () => {
    const catalog = await loadCatalog();
    expect(Object.keys(catalog.mcps).length).toBeGreaterThan(30);
    expect(catalog.mcps.github?.config.type).toBe("remote");
    expect(catalog.mcps.aws?.config.environment).toBeDefined();
    const cloudflare = catalog.skillSources.cloudflare;
    expect(cloudflare?.type).toBe("git");
    expect(cloudflare?.type === "git" ? cloudflare.revision : "").toMatch(/^[a-f0-9]{40}$/);
    expect(catalog.profiles.some((profile) => profile.id === "qdrant")).toBe(true);
  });

  test("rejects duplicate JSONC keys", async () => {
    const value = await fixture();
    await writeFile(value.catalogPath, `{"version":1,"mcps":{},"mcps":{},"skillSources":{},"profiles":[]}`);
    await expect(loadCatalog({ catalogPath: value.catalogPath })).rejects.toThrow("Duplicate JSON property");
  });

  test("discovers every bundled custom skill with valid metadata", async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), "opencode-manager-bundled-skills-"));
    temporaryRoots.push(projectRoot);
    const skills = await listSkills({ projectRoot }, "custom");
    expect(skills).toHaveLength(27);
    expect(new Set(skills.map((skill) => skill.name)).size).toBe(27);
    expect(skills.every((skill) => skill.description.length > 0 && skill.description.length <= 1024)).toBe(true);
    expect(skills.every((skill) => skill.status === "absent")).toBe(true);
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
    const inherited = new Proxy({
      ...catalog.mcps.docs?.config,
      headers: new Proxy({ Authorization: "Bearer resolved-secret\nsecond-line" }, {}),
      enabled: false,
    }, {});
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

  test("rejects a backup directory symlink before overriding an MCP", async () => {
    const value = await fixture();
    const configDir = join(value.projectRoot, ".opencode");
    const managerDir = join(configDir, ".opencode-manager");
    const outside = join(value.root, "outside-backups");
    await Promise.all([mkdir(managerDir, { recursive: true }), mkdir(outside)]);
    await symlink(outside, join(managerDir, "backups"));
    await writeFile(
      join(configDir, "opencode.jsonc"),
      `{"mcp":{"docs":{"type":"local","command":["unexpected"]}}}\n`,
    );

    await expect(setMcpEnabled(value.options, "docs", true, { override: true })).rejects.toThrow(
      "backup directory changed or escapes",
    );
    expect(await readdir(outside)).toHaveLength(0);
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
    await expect(setSkillEnabled(value.options, "custom", "fixture-skill", true)).rejects.toThrow(
      "confirm override",
    );

    await setSkillEnabled(value.options, "custom", "fixture-skill", true, { override: true });
    expect(await readFile(join(destination, "reference.txt"), "utf8")).toBe("registry asset\n");
    const backupRoot = join(value.projectRoot, ".opencode", ".opencode-manager", "backups", "skills", "override");
    const backups = await readdir(backupRoot);
    expect(backups).toHaveLength(1);
    expect(await readFile(join(backupRoot, backups[0]!, "SKILL.md"), "utf8")).toBe("user-owned skill\n");
  });

  test("rejects symlinks in a skill source", async () => {
    const value = await fixture();
    await symlink(join(value.root, "outside"), join(value.registry, "skills", "linked"));
    await expect(listSkills(value.options, "custom")).rejects.toThrow("contains symlink");
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

describe("profiles", () => {
  test("applies and removes a project profile", async () => {
    const value = await fixture();
    const enabled = await setProfileEnabled(value.options, "fixture", true);
    expect(enabled.profile.status).toBe("enabled");
    expect(enabled.mcps[0]?.enabled).toBe(true);
    expect(enabled.skills[0]?.status).toBe("managed");
    expect((await listProfiles(value.options))[0]?.enabledResources).toBe(2);

    const disabled = await setProfileEnabled(value.options, "fixture", false);
    expect(disabled.profile.status).toBe("disabled");
    expect(disabled.mcps[0]?.enabled).toBe(false);
    expect(disabled.skills[0]?.status).toBe("absent");
    expect((await getProfile(value.options, "fixture")).profile.totalResources).toBe(2);
  });

  test("disabling a never-enabled profile does not create MCP config", async () => {
    const value = await fixture();
    const disabled = await setProfileEnabled(value.options, "fixture", false);
    expect(disabled.profile.status).toBe("disabled");
    expect(await exists(join(value.projectRoot, ".opencode", "opencode.jsonc"))).toBe(false);
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
