import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyEdits,
  getNodeValue,
  modify,
  parseTree,
  printParseErrorCode,
  type Node,
  type ParseError,
} from "jsonc-parser";
import { parse as parseYaml } from "yaml";

const DEFAULT_CATALOG_PATH = fileURLToPath(new URL("../registry/catalog.jsonc", import.meta.url));
const EMPTY_PROJECT_CONFIG = `{
  "$schema": "https://opencode.ai/config.json"
}
`;
const ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/;
const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const REVISION_PATTERN = /^[a-f0-9]{40}$/;
const MAX_TREE_FILES = 2_000;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TREE_BYTES = 32 * 1024 * 1024;
const LOCK_TIMEOUT_MS = 10_000;
const LOCK_STALE_MS = 5 * 60_000;

type JsonObject = Record<string, unknown>;

export interface McpRegistryEntry {
  title: string;
  description: string;
  tags: string[];
  config: JsonObject;
}

export interface LocalSkillSource {
  type: "local";
  title: string;
  path: string;
  skillsPath: string;
  license?: string;
}

export interface GitSkillSource {
  type: "git";
  title: string;
  repository: string;
  revision: string;
  skillsPath: string;
  license?: string;
}

export type SkillSource = LocalSkillSource | GitSkillSource;

export interface ProfileSkillRef {
  source: string;
  path: string;
}

export interface RegistryProfile {
  id: string;
  title: string;
  description: string;
  tags: string[];
  mcps: string[];
  skills: ProfileSkillRef[];
}

export interface RegistryCatalog {
  version: 1;
  mcps: Record<string, McpRegistryEntry>;
  skillSources: Record<string, SkillSource>;
  profiles: RegistryProfile[];
}

interface LoadedCatalog extends RegistryCatalog {
  file: string;
  root: string;
}

export interface ManagerOptions {
  projectRoot: string;
  catalogPath?: string;
  effectiveMcp?: Record<string, unknown>;
}

export interface MutationOptions {
  override?: boolean;
}

export type ResourceStatus = "absent" | "enabled" | "disabled" | "managed" | "modified" | "conflict";

export interface McpStatus {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type: "local" | "remote";
  enabled: boolean;
  status: ResourceStatus;
  ownership: "manager" | "project" | "inherited" | "absent";
}

export interface SkillStatus {
  id: string;
  source: string;
  sourceTitle: string;
  path: string;
  name: string;
  description: string;
  nestedSkills: number;
  revision?: string;
  status: ResourceStatus;
}

export interface SkillSourceStatus {
  id: string;
  title: string;
  type: SkillSource["type"];
  repository?: string;
  revision?: string;
  license?: string;
  installed: number;
}

export interface ProfileStatus extends RegistryProfile {
  status: "enabled" | "disabled" | "partial" | "conflict";
  enabledResources: number;
  totalResources: number;
}

export interface ProfileDetail {
  profile: ProfileStatus;
  mcps: McpStatus[];
  skills: SkillStatus[];
}

interface ManagedMcpState {
  appliedHash: string;
}

interface ManagedSkillState {
  source: string;
  sourcePath: string;
  name: string;
  revision?: string;
  digest: string;
}

interface ManagerState {
  version: 1;
  mcps: Record<string, ManagedMcpState>;
  skills: Record<string, ManagedSkillState>;
}

interface ProjectContext {
  root: string;
  configDir: string;
  configFile: string;
  managerDir: string;
  backupDir: string;
  cacheDir: string;
  skillsDir: string;
  stateFile: string;
  lockFile: string;
}

interface ProjectConfig {
  source: string;
  value: JsonObject;
  mode?: number;
}

interface TreeEntry {
  path: string;
  mode: number;
  content?: Buffer;
}

type TreeInspection =
  | { kind: "absent" }
  | { kind: "unsupported" }
  | { kind: "directory"; digest: string };

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`[opencode-manager] ${label} must be a non-empty string`);
  }
  return value;
}

function stringList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`[opencode-manager] ${label} must be an array of non-empty strings`);
  }
  return [...value];
}

function propertyNodes(node: Node): { key: Node; value: Node }[] {
  const properties: { key: Node; value: Node }[] = [];
  for (const property of node.children ?? []) {
    const [key, value] = property.children ?? [];
    if (property.type !== "property" || !key || !value || key.type !== "string") {
      throw new Error("[opencode-manager] Invalid JSON object property");
    }
    properties.push({ key, value });
  }
  return properties;
}

function assertUniqueObjectKeys(node: Node, path = "$"): void {
  if (node.type === "array") {
    for (const child of node.children ?? []) assertUniqueObjectKeys(child, `${path}[]`);
    return;
  }
  if (node.type !== "object") return;

  const seen = new Set<string>();
  for (const { key, value } of propertyNodes(node)) {
    const name = String(key.value);
    if (seen.has(name)) throw new Error(`[opencode-manager] Duplicate JSON property "${path}.${name}"`);
    seen.add(name);
    assertUniqueObjectKeys(value, `${path}.${name}`);
  }
}

function parseJsonc(file: string, source: string): JsonObject {
  const errors: ParseError[] = [];
  const root = parseTree(source, errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length > 0) {
    const details = errors
      .map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
      .join(", ");
    throw new Error(`[opencode-manager] Invalid JSONC in ${file}: ${details}`);
  }
  if (!root || root.type !== "object") throw new Error(`[opencode-manager] ${file} must contain an object`);
  assertUniqueObjectKeys(root);
  const value = getNodeValue(root) as unknown;
  if (!isObject(value)) throw new Error(`[opencode-manager] ${file} must contain an object`);
  return value;
}

function safeRelativePath(value: unknown, label: string): string {
  const path = text(value, label).replaceAll("\\", "/");
  if (isAbsolute(path) || path === ".." || path.startsWith("../") || path.includes("/../")) {
    throw new Error(`[opencode-manager] ${label} must stay inside its registry root`);
  }
  return path.replace(/^\.\//, "").replace(/\/$/, "");
}

function validateMcpConfig(id: string, input: unknown): JsonObject {
  if (!isObject(input)) throw new Error(`[opencode-manager] MCP "${id}" config must be an object`);
  const type = input.type;
  if (type !== "local" && type !== "remote") {
    throw new Error(`[opencode-manager] MCP "${id}" type must be local or remote`);
  }
  const allowed = new Set(
    type === "local"
      ? ["type", "command", "cwd", "environment", "enabled", "timeout"]
      : ["type", "url", "headers", "oauth", "enabled", "timeout"],
  );
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) throw new Error(`[opencode-manager] MCP "${id}" has unsupported field "${key}"`);
  }
  if (type === "local") {
    if (!Array.isArray(input.command) || input.command.length === 0 || input.command.some((item) => typeof item !== "string")) {
      throw new Error(`[opencode-manager] MCP "${id}" command must be a non-empty string array`);
    }
  } else {
    text(input.url, `MCP "${id}" url`);
  }
  if (input.enabled !== undefined && typeof input.enabled !== "boolean") {
    throw new Error(`[opencode-manager] MCP "${id}" enabled must be boolean`);
  }
  for (const field of ["environment", "headers"] as const) {
    const value = input[field];
    if (value === undefined) continue;
    if (!isObject(value) || Object.values(value).some((item) => typeof item !== "string")) {
      throw new Error(`[opencode-manager] MCP "${id}" ${field} must contain string values`);
    }
  }
  return structuredClone(input);
}

function validateRepository(value: unknown, id: string): string {
  const repository = text(value, `skill source "${id}" repository`);
  let url: URL;
  try {
    url = new URL(repository);
  } catch {
    throw new Error(`[opencode-manager] Skill source "${id}" repository must be an HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`[opencode-manager] Skill source "${id}" repository must be an unauthenticated HTTPS URL`);
  }
  return repository;
}

export async function loadCatalog(options: Pick<ManagerOptions, "catalogPath"> = {}): Promise<RegistryCatalog> {
  return loadCatalogInternal(options);
}

async function loadCatalogInternal(options: Pick<ManagerOptions, "catalogPath">): Promise<LoadedCatalog> {
  const file = resolve(options.catalogPath ?? DEFAULT_CATALOG_PATH);
  const value = parseJsonc(file, await readFile(file, "utf8"));
  if (value.version !== 1) throw new Error("[opencode-manager] Registry version must be 1");
  if (!isObject(value.mcps)) throw new Error("[opencode-manager] Registry mcps must be an object");
  if (!isObject(value.skillSources)) throw new Error("[opencode-manager] Registry skillSources must be an object");
  if (!Array.isArray(value.profiles)) throw new Error("[opencode-manager] Registry profiles must be an array");

  const mcps: Record<string, McpRegistryEntry> = {};
  for (const [id, raw] of Object.entries(value.mcps)) {
    if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error(`[opencode-manager] Invalid MCP id "${id}"`);
    mcps[id] = {
      title: text(raw.title, `MCP "${id}" title`),
      description: text(raw.description, `MCP "${id}" description`),
      tags: stringList(raw.tags ?? [], `MCP "${id}" tags`),
      config: validateMcpConfig(id, raw.config),
    };
  }

  const skillSources: Record<string, SkillSource> = {};
  for (const [id, raw] of Object.entries(value.skillSources)) {
    if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error(`[opencode-manager] Invalid skill source id "${id}"`);
    const base = {
      title: text(raw.title, `skill source "${id}" title`),
      skillsPath: safeRelativePath(raw.skillsPath ?? ".", `skill source "${id}" skillsPath`),
      ...(raw.license === undefined ? {} : { license: text(raw.license, `skill source "${id}" license`) }),
    };
    if (raw.type === "local") {
      skillSources[id] = {
        ...base,
        type: "local",
        path: safeRelativePath(raw.path, `skill source "${id}" path`),
      };
      continue;
    }
    if (raw.type === "git") {
      const revision = text(raw.revision, `skill source "${id}" revision`).toLowerCase();
      if (!REVISION_PATTERN.test(revision)) {
        throw new Error(`[opencode-manager] Skill source "${id}" revision must be a full commit SHA`);
      }
      skillSources[id] = {
        ...base,
        type: "git",
        repository: validateRepository(raw.repository, id),
        revision,
      };
      continue;
    }
    throw new Error(`[opencode-manager] Skill source "${id}" type must be local or git`);
  }

  const profiles: RegistryProfile[] = [];
  const profileIDs = new Set<string>();
  for (const raw of value.profiles) {
    if (!isObject(raw)) throw new Error("[opencode-manager] Every profile must be an object");
    const id = text(raw.id, "profile id");
    if (!ID_PATTERN.test(id) || profileIDs.has(id)) throw new Error(`[opencode-manager] Invalid or duplicate profile "${id}"`);
    profileIDs.add(id);
    const profileMcps = stringList(raw.mcps ?? [], `profile "${id}" mcps`);
    for (const mcp of profileMcps) {
      if (!mcps[mcp]) throw new Error(`[opencode-manager] Profile "${id}" references unknown MCP "${mcp}"`);
    }
    if (!Array.isArray(raw.skills)) throw new Error(`[opencode-manager] Profile "${id}" skills must be an array`);
    const skills = raw.skills.map((item, index): ProfileSkillRef => {
      if (!isObject(item)) throw new Error(`[opencode-manager] Profile "${id}" skill ${index} must be an object`);
      const source = text(item.source, `profile "${id}" skill source`);
      if (!skillSources[source]) throw new Error(`[opencode-manager] Profile "${id}" references unknown skill source "${source}"`);
      return { source, path: safeRelativePath(item.path, `profile "${id}" skill path`) };
    });
    profiles.push({
      id,
      title: text(raw.title, `profile "${id}" title`),
      description: text(raw.description, `profile "${id}" description`),
      tags: stringList(raw.tags ?? [], `profile "${id}" tags`),
      mcps: profileMcps,
      skills,
    });
  }

  return { version: 1, file, root: dirname(file), mcps, skillSources, profiles };
}

function isWithin(target: string, root: string): boolean {
  const path = relative(root, target);
  return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}

async function canonicalDirectory(path: string): Promise<string> {
  try {
    return await realpath(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return resolve(path);
  }
}

async function projectContext(projectRoot: string): Promise<ProjectContext> {
  const root = await canonicalDirectory(projectRoot);
  const requestedConfigDir = join(root, ".opencode");
  const configDir = await canonicalDirectory(requestedConfigDir);
  if (!isWithin(configDir, root)) {
    throw new Error(`[opencode-manager] Project config directory escapes project root: ${requestedConfigDir}`);
  }
  const managerDir = await canonicalDirectory(join(configDir, ".opencode-manager"));
  const skillsDir = await canonicalDirectory(join(configDir, "skills"));
  if (!isWithin(managerDir, configDir) || !isWithin(skillsDir, configDir)) {
    throw new Error("[opencode-manager] Managed project paths must stay inside .opencode");
  }
  const candidates = [
    join(configDir, "opencode.jsonc"),
    join(configDir, "opencode.json"),
    join(root, "opencode.jsonc"),
    join(root, "opencode.json"),
  ];
  let configFile = candidates[0]!;
  for (const candidate of candidates) {
    try {
      const canonical = await realpath(candidate);
      if (!isWithin(canonical, root)) {
        throw new Error(`[opencode-manager] Project config escapes project root: ${candidate}`);
      }
      configFile = canonical;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return {
    root,
    configDir,
    configFile,
    managerDir,
    backupDir: join(managerDir, "backups"),
    cacheDir: join(managerDir, "cache"),
    skillsDir,
    stateFile: join(managerDir, "state.json"),
    lockFile: join(managerDir, "manager.lock"),
  };
}

async function ensureContainedDirectory(path: string, parent: string, label: string): Promise<string> {
  await mkdir(path, { recursive: true });
  const [canonical, canonicalParent] = await Promise.all([realpath(path), realpath(parent)]);
  if (canonical !== resolve(path) || !isWithin(canonical, canonicalParent)) {
    throw new Error(`[opencode-manager] ${label} directory changed or escapes its managed parent`);
  }
  return canonical;
}

function emptyState(): ManagerState {
  return { version: 1, mcps: {}, skills: {} };
}

async function readState(context: ProjectContext): Promise<ManagerState> {
  let source: string;
  try {
    source = await readFile(context.stateFile, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return emptyState();
    throw error;
  }
  const value = JSON.parse(source) as unknown;
  if (!isObject(value) || value.version !== 1 || !isObject(value.mcps) || !isObject(value.skills)) {
    throw new Error(`[opencode-manager] Invalid manager state in ${context.stateFile}`);
  }
  return value as unknown as ManagerState;
}

async function writeAtomic(file: string, source: string, mode?: number): Promise<void> {
  await mkdir(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, source, { encoding: "utf8", mode });
    if (mode !== undefined) await chmod(temporary, mode);
    await rename(temporary, file);
  } finally {
    await unlink(temporary).catch(() => undefined);
  }
}

async function writeState(context: ProjectContext, value: ManagerState): Promise<void> {
  await writeAtomic(context.stateFile, `${JSON.stringify(value, null, 2)}\n`, 0o644);
}

async function reclaimStaleLock(file: string): Promise<boolean> {
  try {
    const [source, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
    const lines = source.split(/\r?\n/);
    const pid = Number.parseInt(lines[0] ?? "", 10);
    const createdAt = Number.parseInt(lines[1] ?? "", 10);
    const age = Date.now() - (Number.isFinite(createdAt) ? createdAt : info.mtimeMs);
    if (age >= LOCK_STALE_MS) {
      await unlink(file);
      return true;
    }
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        return false;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") return false;
      }
    } else if (Date.now() - info.mtimeMs < LOCK_TIMEOUT_MS) {
      return false;
    }
    await unlink(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw error;
  }
}

async function withProjectLock<T>(context: ProjectContext, fn: () => Promise<T>): Promise<T> {
  await mkdir(context.managerDir, { recursive: true });
  const canonicalManagerDir = await realpath(context.managerDir);
  if (canonicalManagerDir !== context.managerDir || !isWithin(canonicalManagerDir, context.configDir)) {
    throw new Error("[opencode-manager] Manager state directory changed or escapes .opencode");
  }
  try {
    const ignore = await open(join(context.managerDir, ".gitignore"), "wx", 0o644);
    try {
      await ignore.writeFile("backups/\ncache/\nmanager.lock\n*.tmp\n*.old\n");
    } finally {
      await ignore.close();
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const started = Date.now();
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  while (!handle) {
    try {
      handle = await open(context.lockFile, "wx", 0o600);
      await handle.writeFile(`${process.pid}\n${Date.now()}\n`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (await reclaimStaleLock(context.lockFile)) continue;
      if (Date.now() - started >= LOCK_TIMEOUT_MS) {
        throw new Error(`[opencode-manager] Timed out waiting for project lock ${context.lockFile}`);
      }
      await Bun.sleep(50);
    }
  }
  try {
    return await fn();
  } finally {
    await handle.close();
    await unlink(context.lockFile).catch(() => undefined);
  }
}

async function readProjectConfig(context: ProjectContext): Promise<ProjectConfig> {
  try {
    const [source, info] = await Promise.all([readFile(context.configFile, "utf8"), stat(context.configFile)]);
    const normalized = source.trim() === "" ? EMPTY_PROJECT_CONFIG : source;
    return { source: normalized, value: parseJsonc(context.configFile, normalized), mode: info.mode & 0o777 };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { source: EMPTY_PROJECT_CONFIG, value: parseJsonc(context.configFile, EMPTY_PROJECT_CONFIG) };
  }
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function mcpDefinition(value: unknown): JsonObject | undefined {
  if (!isObject(value) || (value.type !== "local" && value.type !== "remote")) return undefined;
  return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "enabled"));
}

function mcpHash(value: unknown): string | undefined {
  const definition = mcpDefinition(value);
  return definition ? hash(stableJson(definition)) : undefined;
}

function rawMcpMap(config: ProjectConfig): Record<string, unknown> {
  return isObject(config.value.mcp) ? config.value.mcp : {};
}

function effectiveMcp(options: ManagerOptions, id: string): unknown {
  return options.effectiveMcp?.[id];
}

function catalogMcpHash(entry: McpRegistryEntry): string {
  return mcpHash(entry.config)!;
}

function referencePattern(value: string): RegExp | undefined {
  const marker = /\{(?:env|file):[^}]+\}/g;
  if (!marker.test(value)) return undefined;
  marker.lastIndex = 0;
  let source = "^";
  let offset = 0;
  for (const match of value.matchAll(marker)) {
    const index = match.index ?? 0;
    source += value.slice(offset, index).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    source += ".*";
    offset = index + match[0].length;
  }
  source += `${value.slice(offset).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`;
  return new RegExp(source, "s");
}

function registryValueMatches(expected: unknown, actual: unknown): boolean {
  if (typeof expected === "string" && typeof actual === "string") {
    return referencePattern(expected)?.test(actual) ?? expected === actual;
  }
  if (Array.isArray(expected)) {
    return Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) => registryValueMatches(item, actual[index]));
  }
  if (isObject(expected)) {
    if (!isObject(actual)) return false;
    const expectedKeys = Object.keys(expected).filter((key) => key !== "enabled").sort();
    const actualKeys = Object.keys(actual).filter((key) => key !== "enabled").sort();
    return expectedKeys.length === actualKeys.length &&
      expectedKeys.every((key, index) => key === actualKeys[index] && registryValueMatches(expected[key], actual[key]));
  }
  return Object.is(expected, actual);
}

function matchesMcpRegistry(entry: McpRegistryEntry, value: unknown): boolean {
  return registryValueMatches(mcpDefinition(entry.config), mcpDefinition(value));
}

function classifyMcp(
  entry: McpRegistryEntry,
  raw: unknown,
  inherited: unknown,
  managed: ManagedMcpState | undefined,
): Omit<McpStatus, "id" | "title" | "description" | "tags" | "type"> {
  const candidate = mcpDefinition(raw) ? raw : inherited;
  const enabled = isObject(raw) && typeof raw.enabled === "boolean"
    ? raw.enabled
    : isObject(inherited) && typeof inherited.enabled === "boolean"
      ? inherited.enabled
      : entry.config.enabled === true;
  const ownership = managed ? "manager" : raw !== undefined ? "project" : inherited !== undefined ? "inherited" : "absent";
  if (candidate && !matchesMcpRegistry(entry, candidate)) {
    return { enabled, status: "conflict", ownership };
  }
  if (managed && isObject(raw) && mcpHash(raw) !== managed.appliedHash) {
    return { enabled, status: "conflict", ownership };
  }
  if (!candidate && raw !== undefined) return { enabled, status: "conflict", ownership };
  return { enabled, status: enabled ? "enabled" : raw === undefined && inherited === undefined ? "absent" : "disabled", ownership };
}

export async function listMcps(options: ManagerOptions): Promise<McpStatus[]> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const [config, state] = await Promise.all([readProjectConfig(context), readState(context)]);
  const raw = rawMcpMap(config);
  return Object.entries(catalog.mcps).map(([id, entry]) => ({
    id,
    title: entry.title,
    description: entry.description,
    tags: entry.tags,
    type: entry.config.type as "local" | "remote",
    ...classifyMcp(entry, raw[id], effectiveMcp(options, id), state.mcps[id]),
  }));
}

async function backupMcp(context: ProjectContext, id: string, value: unknown): Promise<void> {
  if (value === undefined) return;
  const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
  const directory = await ensureContainedDirectory(join(backupRoot, "mcps"), backupRoot, "MCP backup");
  const file = join(directory, `${id}-${Date.now()}-${randomUUID()}.json`);
  await writeAtomic(file, `${JSON.stringify(value, null, 2)}\n`, 0o600);
}

export async function setMcpEnabled(
  options: ManagerOptions,
  id: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<McpStatus> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const entry = catalog.mcps[id];
  if (!entry) throw new Error(`[opencode-manager] Unknown MCP "${id}"`);

  await withProjectLock(context, async () => {
    const [config, state] = await Promise.all([readProjectConfig(context), readState(context)]);
    const raw = rawMcpMap(config)[id];
    const inherited = effectiveMcp(options, id);
    const managed = state.mcps[id];
    const expectedHash = catalogMcpHash(entry);
    let replacement: JsonObject | undefined;
    let nextSource: string;

    if (managed) {
      if (!isObject(raw) || mcpHash(raw) !== managed.appliedHash) {
        if (!mutation.override) {
          throw new Error(`[opencode-manager] MCP "${id}" was modified after manager installation`);
        }
        await backupMcp(context, id, raw);
      }
      replacement = { ...structuredClone(entry.config), enabled };
      nextSource = applyEdits(
        config.source,
        modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
      );
      state.mcps[id] = { appliedHash: expectedHash };
    } else if (mcpDefinition(raw)) {
      if (!matchesMcpRegistry(entry, raw)) {
        if (!mutation.override) {
          throw new Error(`[opencode-manager] MCP "${id}" conflicts with the registry definition`);
        }
        await backupMcp(context, id, raw);
        replacement = { ...structuredClone(entry.config), enabled };
        nextSource = applyEdits(
          config.source,
          modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
        );
        state.mcps[id] = { appliedHash: expectedHash };
      } else {
        nextSource = applyEdits(
          config.source,
          modify(config.source, ["mcp", id, "enabled"], enabled, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
        );
      }
    } else if (mcpDefinition(inherited)) {
      if (!matchesMcpRegistry(entry, inherited)) {
        if (!mutation.override) {
          throw new Error(`[opencode-manager] Inherited MCP "${id}" conflicts with the registry definition`);
        }
        replacement = { ...structuredClone(entry.config), enabled };
        nextSource = applyEdits(
          config.source,
          modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
        );
        state.mcps[id] = { appliedHash: expectedHash };
      } else {
        nextSource = applyEdits(
          config.source,
          modify(config.source, ["mcp", id, "enabled"], enabled, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
        );
      }
    } else {
      if (raw !== undefined) {
        if (!mutation.override) {
          throw new Error(`[opencode-manager] MCP "${id}" has an override without a matching effective definition`);
        }
        await backupMcp(context, id, raw);
      }
      replacement = { ...structuredClone(entry.config), enabled };
      nextSource = applyEdits(
        config.source,
        modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
      );
      state.mcps[id] = { appliedHash: expectedHash };
    }

    if (nextSource !== config.source) await writeAtomic(context.configFile, nextSource, config.mode);
    await writeState(context, state);
  });

  const updated = (await listMcps(options)).find((item) => item.id === id);
  if (!updated) throw new Error(`[opencode-manager] MCP "${id}" disappeared from the registry`);
  return updated;
}

function runGit(args: string[], cwd?: string, timeoutMs = 90_000): Promise<string> {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn("git", ["-c", "protocol.file.allow=never", "-c", "core.hooksPath=/dev/null", ...args], {
      cwd,
      env: {
        ...process.env,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_NOSYSTEM: "1",
        GIT_LFS_SKIP_SMUDGE: "1",
        GIT_OPTIONAL_LOCKS: "0",
        GIT_TERMINAL_PROMPT: "0",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolvePromise(Buffer.concat(stdout).toString("utf8").trim());
        return;
      }
      const detail = Buffer.concat(stderr).toString("utf8").trim();
      rejectPromise(new Error(`[opencode-manager] git ${args[0] ?? "command"} failed${detail ? `: ${detail}` : ""}`));
    });
  });
}

async function ensureGitSource(context: ProjectContext, id: string, source: GitSkillSource): Promise<string> {
  const cacheDir = await ensureContainedDirectory(context.cacheDir, context.managerDir, "vendor cache");
  const target = join(cacheDir, id);
  if (!isWithin(target, context.managerDir)) throw new Error(`[opencode-manager] Invalid cache path for "${id}"`);
  try {
    const info = await lstat(target);
    if (info.isSymbolicLink() || !info.isDirectory() || !isWithin(await realpath(target), cacheDir)) {
      throw new Error(`[opencode-manager] Invalid cache directory for "${id}"`);
    }
    const [head, status, origin] = await Promise.all([
      runGit(["-C", target, "rev-parse", "HEAD"]),
      runGit(["-C", target, "status", "--porcelain", "--untracked-files=all", "--ignored=matching"]),
      runGit(["-C", target, "remote", "get-url", "origin"]),
    ]);
    if (head === source.revision && status === "" && origin === source.repository) return target;
  } catch (error) {
    if ((error as Error).message?.includes("Invalid cache directory")) throw error;
    // Replace an absent or stale manager-owned cache below.
  }

  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const previous = `${target}.${process.pid}.${randomUUID()}.old`;
  try {
    await runGit(["clone", "--filter=blob:none", "--no-checkout", "--no-recurse-submodules", source.repository, temporary]);
    await runGit(["-C", temporary, "fetch", "--depth", "1", "origin", source.revision]);
    await runGit(["-C", temporary, "checkout", "--detach", "FETCH_HEAD"]);
    const head = await runGit(["-C", temporary, "rev-parse", "HEAD"]);
    if (head !== source.revision) throw new Error(`[opencode-manager] Source "${id}" resolved to unexpected commit ${head}`);
    try {
      await lstat(join(temporary, ".gitmodules"));
      throw new Error(`[opencode-manager] Source "${id}" contains submodules, which are not supported`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    let movedPrevious = false;
    try {
      await rename(target, previous);
      movedPrevious = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    try {
      await rename(temporary, target);
    } catch (error) {
      if (movedPrevious) await rename(previous, target).catch(() => undefined);
      throw error;
    }
    if (movedPrevious) await rm(previous, { recursive: true, force: true });
    return target;
  } finally {
    await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
    await rm(previous, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function skillSourceRoot(catalog: LoadedCatalog, context: ProjectContext, id: string): Promise<string> {
  const source = catalog.skillSources[id];
  if (!source) throw new Error(`[opencode-manager] Unknown skill source "${id}"`);
  const root = source.type === "local"
    ? resolve(catalog.root, source.path)
    : await ensureGitSource(context, id, source);
  const canonicalRoot = await realpath(root);
  if (source.type === "local") {
    const canonicalCatalogRoot = await realpath(catalog.root);
    if (!isWithin(canonicalRoot, canonicalCatalogRoot)) {
      throw new Error(`[opencode-manager] Local skill source "${id}" escapes the registry root`);
    }
  }
  const skillsRoot = await realpath(resolve(canonicalRoot, source.skillsPath));
  if (!isWithin(skillsRoot, canonicalRoot)) {
    throw new Error(`[opencode-manager] Skill source "${id}" skillsPath escapes its source root`);
  }
  return skillsRoot;
}

async function collectTree(root: string): Promise<TreeEntry[]> {
  const entries: TreeEntry[] = [];
  let bytes = 0;
  async function visit(directory: string, prefix: string): Promise<void> {
    const names = (await readdir(directory)).sort();
    for (const name of names) {
      const absolute = join(directory, name);
      const path = prefix ? `${prefix}/${name}` : name;
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) throw new Error(`[opencode-manager] Skill tree contains symlink "${path}"`);
      if (info.isDirectory()) {
        entries.push({ path: `${path}/`, mode: info.mode & 0o777 });
        if (entries.length > MAX_TREE_FILES) throw new Error("[opencode-manager] Skill tree has too many entries");
        await visit(absolute, path);
        continue;
      }
      if (!info.isFile()) throw new Error(`[opencode-manager] Skill tree contains unsupported entry "${path}"`);
      if (info.size > MAX_FILE_BYTES) throw new Error(`[opencode-manager] Skill file "${path}" is too large`);
      bytes += info.size;
      if (bytes > MAX_TREE_BYTES) throw new Error("[opencode-manager] Skill tree is too large");
      const content = await readFile(absolute);
      entries.push({ path, mode: info.mode & 0o777, content });
      if (entries.length > MAX_TREE_FILES) throw new Error("[opencode-manager] Skill tree has too many entries");
    }
  }
  await visit(root, "");
  return entries;
}

function digestEntries(entries: TreeEntry[]): string {
  const digest = createHash("sha256");
  for (const entry of entries) {
    digest.update(entry.path);
    digest.update("\0");
    digest.update(entry.mode.toString(8));
    digest.update("\0");
    if (entry.content) digest.update(entry.content);
    digest.update("\0");
  }
  return digest.digest("hex");
}

async function inspectTree(path: string): Promise<TreeInspection> {
  try {
    const info = await lstat(path);
    if (info.isSymbolicLink() || !info.isDirectory()) return { kind: "unsupported" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "absent" };
    throw error;
  }
  return { kind: "directory", digest: digestEntries(await collectTree(path)) };
}

async function copyEntries(entries: TreeEntry[], destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  for (const entry of entries) {
    const target = join(destination, entry.path);
    if (!isWithin(target, destination)) throw new Error(`[opencode-manager] Skill entry escapes destination: ${entry.path}`);
    if (entry.path.endsWith("/")) {
      await mkdir(target, { recursive: true, mode: entry.mode });
      await chmod(target, entry.mode);
    } else {
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, entry.content!, { mode: entry.mode });
      await chmod(target, entry.mode);
    }
  }
}

async function ensureSkillsDirectory(context: ProjectContext): Promise<void> {
  await mkdir(context.skillsDir, { recursive: true });
  const canonical = await realpath(context.skillsDir);
  if (canonical !== context.skillsDir || !isWithin(canonical, context.configDir)) {
    throw new Error("[opencode-manager] Project skills directory changed or escapes .opencode");
  }
}

function parseSkillFrontmatter(file: string, source: string): { name: string; description: string } {
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error(`[opencode-manager] Skill ${file} has no YAML frontmatter`);
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`[opencode-manager] Skill ${file} has unterminated YAML frontmatter`);
  const value = parseYaml(lines.slice(1, end).join("\n")) as unknown;
  if (!isObject(value)) throw new Error(`[opencode-manager] Skill ${file} frontmatter must be an object`);
  const name = text(value.name, `skill ${file} name`);
  if (!SKILL_NAME_PATTERN.test(name) || name.length > 64) {
    throw new Error(`[opencode-manager] Skill ${file} has invalid name "${name}"`);
  }
  return { name, description: text(value.description, `skill ${file} description`) };
}

async function discoverSkillDirectories(root: string): Promise<string[]> {
  const found: string[] = [];
  let visited = 0;
  async function visit(directory: string): Promise<void> {
    for (const name of (await readdir(directory)).sort()) {
      const absolute = join(directory, name);
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) throw new Error(`[opencode-manager] Skill source contains symlink ${absolute}`);
      if (info.isFile() && name === "SKILL.md") found.push(dirname(absolute));
      if (info.isDirectory()) await visit(absolute);
      visited += 1;
      if (visited > 20_000) throw new Error("[opencode-manager] Skill source has too many entries");
    }
  }
  await visit(root);
  return found;
}

export async function listSkillSources(options: ManagerOptions): Promise<SkillSourceStatus[]> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const state = await readState(context);
  return Object.entries(catalog.skillSources).map(([id, source]) => ({
    id,
    title: source.title,
    type: source.type,
    ...(source.type === "git" ? { repository: source.repository, revision: source.revision } : {}),
    ...(source.license ? { license: source.license } : {}),
    installed: Object.values(state.skills).filter((skill) => skill.source === id).length,
  }));
}

export async function listSkills(options: ManagerOptions, sourceID: string): Promise<SkillStatus[]> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const source = catalog.skillSources[sourceID];
  if (!source) throw new Error(`[opencode-manager] Unknown skill source "${sourceID}"`);
  const root = await skillSourceRoot(catalog, context, sourceID);
  const discovered = await discoverSkillDirectories(root);
  const directorySet = new Set(discovered);
  const directories = discovered.filter((directory) => {
    let parent = dirname(directory);
    while (isWithin(parent, root) && parent !== root) {
      if (directorySet.has(parent)) return false;
      parent = dirname(parent);
    }
    return true;
  });
  const state = await readState(context);
  const names = new Map<string, string>();
  const manifests = await Promise.all(
    directories.map(async (directory) => {
      const path = relative(root, directory).split(sep).join("/") || ".";
      const manifest = parseSkillFrontmatter(join(directory, "SKILL.md"), await readFile(join(directory, "SKILL.md"), "utf8"));
      const duplicate = names.get(manifest.name);
      if (duplicate) throw new Error(`[opencode-manager] Skill source "${sourceID}" has duplicate name "${manifest.name}" at ${duplicate} and ${path}`);
      names.set(manifest.name, path);
      return { directory, path, ...manifest };
    }),
  );

  const result: SkillStatus[] = [];
  for (const manifest of manifests) {
    const id = `${sourceID}:${manifest.path}`;
    const managed = state.skills[id];
    const destination = join(context.skillsDir, manifest.name);
    if (!isWithin(destination, context.configDir)) throw new Error(`[opencode-manager] Invalid skill destination for "${manifest.name}"`);
    const current = await inspectTree(destination);
    let status: ResourceStatus = "absent";
    if (current.kind === "unsupported") status = "conflict";
    if (current.kind === "directory" && !managed) status = "conflict";
    if (current.kind === "directory" && managed) status = current.digest === managed.digest ? "managed" : "modified";
    if (current.kind === "absent" && managed) status = "modified";
    const nestedSkills = discovered.filter(
      (candidate) => candidate !== manifest.directory && isWithin(candidate, manifest.directory),
    ).length;
    result.push({
      id,
      source: sourceID,
      sourceTitle: source.title,
      path: manifest.path,
      name: manifest.name,
      description: manifest.description,
      nestedSkills,
      ...(source.type === "git" ? { revision: source.revision } : {}),
      status,
    });
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}

async function skillArchivePath(context: ProjectContext, name: string, reason: "override" | "disabled"): Promise<string> {
  const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
  const skillsRoot = await ensureContainedDirectory(join(backupRoot, "skills"), backupRoot, "skill backup");
  const directory = await ensureContainedDirectory(join(skillsRoot, reason), skillsRoot, `${reason} skill backup`);
  return join(directory, `${name}-${Date.now()}-${randomUUID()}`);
}

async function replaceSkillTree(
  entries: TreeEntry[],
  destination: string,
  preservedPrevious?: string,
): Promise<void> {
  const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
  const previous = `${destination}.${process.pid}.${randomUUID()}.old`;
  await mkdir(dirname(destination), { recursive: true });
  try {
    await copyEntries(entries, temporary);
    let movedPrevious = false;
    const previousTarget = preservedPrevious ?? previous;
    try {
      await rename(destination, previousTarget);
      movedPrevious = true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
    try {
      await rename(temporary, destination);
    } catch (error) {
      if (movedPrevious) await rename(previousTarget, destination).catch(() => undefined);
      throw error;
    }
    if (movedPrevious && !preservedPrevious) await rm(previous, { recursive: true, force: true });
  } finally {
    await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
    await rm(previous, { recursive: true, force: true }).catch(() => undefined);
  }
}

export async function setSkillEnabled(
  options: ManagerOptions,
  sourceID: string,
  skillPath: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<SkillStatus> {
  const [catalog, context, available] = await Promise.all([
    loadCatalogInternal(options),
    projectContext(options.projectRoot),
    listSkills(options, sourceID),
  ]);
  const normalizedPath = safeRelativePath(skillPath, "skill path");
  const skill = available.find((item) => item.path === normalizedPath);
  if (!skill) throw new Error(`[opencode-manager] Unknown skill "${sourceID}:${normalizedPath}"`);
  const source = catalog.skillSources[sourceID]!;
  const root = await skillSourceRoot(catalog, context, sourceID);
  const sourceDirectory = resolve(root, normalizedPath);
  if (!isWithin(sourceDirectory, root)) throw new Error(`[opencode-manager] Skill path escapes source root`);
  const destination = join(context.skillsDir, skill.name);
  const id = `${sourceID}:${normalizedPath}`;

  await withProjectLock(context, async () => {
    await ensureSkillsDirectory(context);
    const state = await readState(context);
    const managed = state.skills[id];
    const current = await inspectTree(destination);
    const owner = Object.entries(state.skills).find(([otherID, item]) => otherID !== id && item.name === skill.name);

    if (enabled) {
      if (current.kind === "unsupported") {
        throw new Error(`[opencode-manager] Skill destination "${skill.name}" is a file or symlink`);
      }
      const currentDigest = current.kind === "directory" ? current.digest : undefined;
      const conflict = owner !== undefined || (current.kind === "directory" && !managed) || (managed && currentDigest !== managed.digest);
      if (conflict && !mutation.override) {
        const reason = owner
          ? `is already managed by ${owner[0]}`
          : managed
            ? "was modified after manager installation"
            : "already exists and is unmanaged";
        throw new Error(`[opencode-manager] Skill "${skill.name}" ${reason}; confirm override to preserve and replace it`);
      }
      const entries = await collectTree(sourceDirectory);
      const digest = digestEntries(entries);
      const preserve = conflict && current.kind === "directory"
        ? await skillArchivePath(context, skill.name, "override")
        : undefined;
      if (currentDigest !== digest || owner) await replaceSkillTree(entries, destination, preserve);
      if (owner) delete state.skills[owner[0]];
      state.skills[id] = {
        source: sourceID,
        sourcePath: normalizedPath,
        name: skill.name,
        ...(source.type === "git" ? { revision: source.revision } : {}),
        digest,
      };
      await writeState(context, state);
      return;
    }

    if (!managed) {
      if (current.kind !== "absent") {
        throw new Error(`[opencode-manager] Refusing to disable unmanaged skill "${skill.name}"`);
      }
      return;
    }
    if (current.kind === "unsupported") {
      throw new Error(`[opencode-manager] Managed skill destination "${skill.name}" became a file or symlink`);
    }
    if (current.kind === "absent") {
      if (!mutation.override) throw new Error(`[opencode-manager] Managed skill "${skill.name}" is missing`);
      delete state.skills[id];
      await writeState(context, state);
      return;
    }
    if (current.digest !== managed.digest && !mutation.override) {
      throw new Error(`[opencode-manager] Refusing to disable modified skill "${skill.name}" without confirmation`);
    }
    const archive = await skillArchivePath(context, skill.name, "disabled");
    await rename(destination, archive);
    delete state.skills[id];
    await writeState(context, state);
  });

  const updated = (await listSkills(options, sourceID)).find((item) => item.path === normalizedPath);
  if (!updated) throw new Error(`[opencode-manager] Skill "${id}" disappeared from its source`);
  return updated;
}

function profileState(profile: RegistryProfile, mcps: McpStatus[], state: ManagerState): ProfileStatus["status"] {
  const mcpItems = profile.mcps.map((id) => mcps.find((item) => item.id === id)!);
  if (mcpItems.some((item) => item.status === "conflict")) return "conflict";
  const skillIDs = profile.skills.map((item) => `${item.source}:${item.path}`);
  const enabledCount = mcpItems.filter((item) => item.enabled).length + skillIDs.filter((id) => state.skills[id]).length;
  const total = mcpItems.length + skillIDs.length;
  if (enabledCount === 0) return "disabled";
  if (enabledCount === total) return "enabled";
  return "partial";
}

export async function listProfiles(options: ManagerOptions): Promise<ProfileStatus[]> {
  const [catalog, context, mcps] = await Promise.all([
    loadCatalogInternal(options),
    projectContext(options.projectRoot),
    listMcps(options),
  ]);
  const state = await readState(context);
  return catalog.profiles.map((profile) => {
    const enabledResources =
      profile.mcps.filter((id) => mcps.find((item) => item.id === id)?.enabled).length +
      profile.skills.filter((item) => state.skills[`${item.source}:${item.path}`]).length;
    return {
      ...profile,
      status: profileState(profile, mcps, state),
      enabledResources,
      totalResources: profile.mcps.length + profile.skills.length,
    };
  });
}

export async function getProfile(options: ManagerOptions, profileID: string): Promise<ProfileDetail> {
  const [catalog, profiles, mcps] = await Promise.all([
    loadCatalogInternal(options),
    listProfiles(options),
    listMcps(options),
  ]);
  const profile = profiles.find((item) => item.id === profileID);
  if (!profile) throw new Error(`[opencode-manager] Unknown profile "${profileID}"`);
  const refs = catalog.profiles.find((item) => item.id === profileID)!.skills;
  const sourceIDs = [...new Set(refs.map((item) => item.source))];
  const sourceSkills = new Map<string, SkillStatus[]>();
  await Promise.all(
    sourceIDs.map(async (sourceID) => sourceSkills.set(sourceID, await listSkills(options, sourceID))),
  );
  const skills = refs.map((ref) => {
    const skill = sourceSkills.get(ref.source)?.find((item) => item.path === ref.path);
    if (!skill) throw new Error(`[opencode-manager] Profile "${profileID}" references missing skill "${ref.source}:${ref.path}"`);
    return skill;
  });
  const hasConflict =
    mcps.some((item) => profile.mcps.includes(item.id) && item.status === "conflict") ||
    skills.some((item) => item.status === "conflict" || item.status === "modified");
  return {
    profile: hasConflict ? { ...profile, status: "conflict" } : profile,
    mcps: profile.mcps.map((id) => mcps.find((item) => item.id === id)!),
    skills,
  };
}

export async function setProfileEnabled(
  options: ManagerOptions,
  profileID: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<ProfileDetail> {
  const detail = await getProfile(options, profileID);
  const mcpConflict = detail.mcps.find((item) =>
    enabled ? item.status === "conflict" : item.status === "conflict" && item.ownership === "manager",
  );
  if (mcpConflict && !mutation.override) {
    throw new Error(`[opencode-manager] Profile "${profileID}" has conflicting MCP "${mcpConflict.id}"; confirm override to continue`);
  }
  const skillConflict = detail.skills.find((item) =>
    enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified",
  );
  if (skillConflict && !mutation.override) {
    throw new Error(`[opencode-manager] Profile "${profileID}" has conflicting skill "${skillConflict.name}"; confirm override to continue`);
  }

  let applied = 0;
  try {
    for (const mcp of detail.mcps) {
      if (!enabled && mcp.status === "absent") continue;
      if (!enabled && mcp.status === "conflict" && mcp.ownership !== "manager") continue;
      await setMcpEnabled(options, mcp.id, enabled, mutation);
      applied += 1;
    }
    for (const skill of detail.skills) {
      if (!enabled && (skill.status === "absent" || skill.status === "conflict")) continue;
      await setSkillEnabled(options, skill.source, skill.path, enabled, mutation);
      applied += 1;
    }
  } catch (error) {
    if (applied === 0) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(
      new Error(`[opencode-manager] Profile "${profileID}" was partially applied: ${message}`),
      { partialApplied: true, cause: error },
    );
  }
  return getProfile(options, profileID);
}
