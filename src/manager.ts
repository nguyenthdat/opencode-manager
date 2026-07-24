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
import { homedir } from "node:os";
import { dirname, isAbsolute, join, posix, relative, resolve, sep } from "node:path";
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
const AGENT_PATH_PATTERN = /^[a-z0-9][a-z0-9._-]*(?:\/[a-z0-9][a-z0-9._-]*)*$/;
const REVISION_PATTERN = /^[a-f0-9]{40}$/;
const MAX_TREE_FILES = 2_000;
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TREE_BYTES = 32 * 1024 * 1024;
const LOCK_TIMEOUT_MS = 10_000;
const LOCK_STALE_MS = 30 * 60_000;
const DEFAULT_REGISTRY_REPOSITORY = "https://github.com/nguyenthdat/opencode-manager.git";
const DEFAULT_REGISTRY_REF = "main";
const DEFAULT_REGISTRY_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const INSTALLER_COMMAND_TIMEOUT_MS = 20 * 60 * 1000;
const MAX_COMMAND_OUTPUT_CHARS = 64 * 1024;

type JsonObject = Record<string, unknown>;

export interface McpRegistryEntry {
  title: string;
  description: string;
  tags: string[];
  config: JsonObject;
}

export interface PluginRegistryEntry {
  title: string;
  description: string;
  tags: string[];
  package: string;
}

export interface InstallerRegistryEntry {
  type: "git";
  title: string;
  description: string;
  tags: string[];
  repository: string;
  revision: string;
  install: string[];
  uninstall?: string[];
  cleanup: InstallerCleanupRule[];
  marker: string;
  license?: string;
}

export interface InstallerCleanupRule {
  directory: string;
  prefix: string;
}

export interface FileRegistryEntry {
  title: string;
  description: string;
  tags: string[];
  path: string;
}

export interface AgentRegistryEntry extends FileRegistryEntry {
  type: "single" | "team";
}

export interface LocalSkillSource {
  type: "local";
  title: string;
  path: string;
  skillsPath: string;
  license?: string;
  ignoreSymlinks?: boolean;
}

export interface GitSkillSource {
  type: "git";
  title: string;
  repository: string;
  revision: string;
  skillsPath: string;
  license?: string;
  ignoreSymlinks?: boolean;
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
  rules: string[];
  agents: string[];
}

export interface RegistryCatalog {
  version: 1;
  mcps: Record<string, McpRegistryEntry>;
  plugins: Record<string, PluginRegistryEntry>;
  installers?: Record<string, InstallerRegistryEntry>;
  skillSources: Record<string, SkillSource>;
  rules: Record<string, FileRegistryEntry>;
  agents: Record<string, AgentRegistryEntry>;
  profiles: RegistryProfile[];
}

interface LoadedCatalog extends Omit<RegistryCatalog, "installers"> {
  installers: Record<string, InstallerRegistryEntry>;
  file: string;
  root: string;
}

export interface ManagerOptions {
  projectRoot: string;
  catalogPath?: string;
  installerDataRoot?: string;
  installerHome?: string;
  effectiveMcp?: Record<string, unknown>;
  effectiveAgent?: Record<string, unknown>;
  effectivePlugin?: readonly unknown[];
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

export interface PluginStatus extends PluginRegistryEntry {
  id: string;
  enabled: boolean;
  status: ResourceStatus;
  ownership: "manager" | "project" | "inherited" | "absent";
}

export interface InstallerStatus extends InstallerRegistryEntry {
  id: string;
  installed: boolean;
  status: ResourceStatus;
  ownership: "manager" | "external" | "absent";
}

export interface RegistrySyncResult {
  catalogPath: string;
  revision?: string;
  status: "updated" | "current" | "stale";
  error?: string;
}

export interface RegistrySyncSettings {
  repository?: string;
  ref?: string;
  force?: boolean;
  maxAgeMs?: number;
  cacheRoot?: string;
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

export interface RuleStatus extends FileRegistryEntry {
  id: string;
  status: ResourceStatus;
  ownership: "manager" | "project" | "absent";
}

export interface AgentStatus extends AgentRegistryEntry {
  id: string;
  members: number;
  status: ResourceStatus;
  ownership: "manager" | "project" | "inherited" | "absent";
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
  rules: RuleStatus[];
  agents: AgentStatus[];
}

interface ManagedMcpState {
  appliedHash: string;
}

interface ManagedPluginState {
  package: string;
}

interface ManagedSkillState {
  source: string;
  sourcePath: string;
  name: string;
  revision?: string;
  digest: string;
}

interface ManagedRuleState extends FileRegistryEntry {
  digest: string;
  configFile: string;
}

interface ManagedAgentState extends AgentRegistryEntry {
  digest: string;
  members: number;
}

interface ManagerState {
  version: 1;
  mcps: Record<string, ManagedMcpState>;
  plugins: Record<string, ManagedPluginState>;
  skills: Record<string, ManagedSkillState>;
  rules: Record<string, ManagedRuleState>;
  agents: Record<string, ManagedAgentState>;
}

interface InstallerState {
  version: 1;
  installers: Record<string, ManagedInstallerState>;
}

interface ManagedInstallerState {
  entry: InstallerRegistryEntry;
  home: string;
  baseline: InstallerBaseline[];
  pending: boolean;
  marker?: InstallerMarkerState;
}

interface InstallerBaseline extends InstallerCleanupRule {
  names: string[];
}

interface InstallerMarkerState {
  kind: "file" | "symlink";
  digest: string;
  target?: string;
}

interface ProjectContext {
  root: string;
  configDir: string;
  configFile: string;
  managerDir: string;
  backupDir: string;
  cacheDir: string;
  skillsDir: string;
  instructionsDir: string;
  agentsDir: string;
  stateFile: string;
  lockFile: string;
}

interface ProjectConfig {
  file: string;
  source: string;
  value: JsonObject;
  mode?: number;
}

interface TreeEntry {
  path: string;
  mode: number;
  content?: Buffer;
}

type TreeInspection = { kind: "absent" } | { kind: "unsupported" } | { kind: "directory"; digest: string };

type FileInspection = { kind: "absent" } | { kind: "unsupported" } | { kind: "file"; digest: string };

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function own<T>(record: Record<string, T>, key: string): T | undefined {
  return Object.hasOwn(record, key) ? record[key] : undefined;
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
    const details = errors.map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`).join(", ");
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
  const normalized = posix.normalize(path);
  if (isAbsolute(path) || normalized === ".." || normalized.startsWith("../")) {
    throw new Error(`[opencode-manager] ${label} must stay inside its registry root`);
  }
  return normalized.replace(/\/+$/, "") || ".";
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
    if (
      !Array.isArray(input.command) ||
      input.command.length === 0 ||
      input.command.some((item) => typeof item !== "string")
    ) {
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

function validateRepository(value: unknown, id: string, kind = "skill source"): string {
  const repository = text(value, `${kind} "${id}" repository`);
  let url: URL;
  try {
    url = new URL(repository);
  } catch {
    throw new Error(`[opencode-manager] ${kind} "${id}" repository must be an HTTPS URL`);
  }
  if (url.protocol !== "https:" || url.username || url.password) {
    throw new Error(`[opencode-manager] ${kind} "${id}" repository must be an unauthenticated HTTPS URL`);
  }
  return repository;
}

function validateInstallerCommand(value: unknown, id: string, action: "install" | "uninstall"): string[] {
  const command = stringList(value, `installer "${id}" ${action}`);
  if (command.length === 0) throw new Error(`[opencode-manager] Installer "${id}" ${action} must not be empty`);
  const executable = safeRelativePath(command[0], `installer "${id}" ${action} executable`);
  if (executable === ".") throw new Error(`[opencode-manager] Installer "${id}" ${action} executable is invalid`);
  return [executable, ...command.slice(1)];
}

function validateInstallerCleanup(value: unknown, id: string): InstallerCleanupRule[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`[opencode-manager] Installer "${id}" cleanup must be an array`);
  return value.map((raw, index) => {
    if (!isObject(raw)) throw new Error(`[opencode-manager] Installer "${id}" cleanup ${index} must be an object`);
    const directory = safeRelativePath(raw.directory, `installer "${id}" cleanup ${index} directory`);
    const prefix = text(raw.prefix, `installer "${id}" cleanup ${index} prefix`);
    if (directory === "." || !ID_PATTERN.test(prefix)) {
      throw new Error(`[opencode-manager] Installer "${id}" cleanup ${index} is invalid`);
    }
    return { directory, prefix };
  });
}

function validateInstallerRegistry(value: unknown): Record<string, InstallerRegistryEntry> {
  if (!isObject(value)) throw new Error("[opencode-manager] Registry installers must be an object");
  const installers: Record<string, InstallerRegistryEntry> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error(`[opencode-manager] Invalid installer id "${id}"`);
    if (raw.type !== "git") throw new Error(`[opencode-manager] Installer "${id}" type must be git`);
    const revision = text(raw.revision, `installer "${id}" revision`).toLowerCase();
    if (!REVISION_PATTERN.test(revision)) {
      throw new Error(`[opencode-manager] Installer "${id}" revision must be a full commit SHA`);
    }
    const marker = safeRelativePath(raw.marker, `installer "${id}" marker`);
    if (marker === ".") throw new Error(`[opencode-manager] Installer "${id}" marker is invalid`);
    const cleanup = validateInstallerCleanup(raw.cleanup, id);
    if (raw.uninstall === undefined && cleanup.length === 0) {
      throw new Error(`[opencode-manager] Installer "${id}" requires uninstall or cleanup metadata`);
    }
    installers[id] = {
      type: "git",
      title: text(raw.title, `installer "${id}" title`),
      description: text(raw.description, `installer "${id}" description`),
      tags: stringList(raw.tags ?? [], `installer "${id}" tags`),
      repository: validateRepository(raw.repository, id, "installer"),
      revision,
      install: validateInstallerCommand(raw.install, id, "install"),
      ...(raw.uninstall === undefined ? {} : { uninstall: validateInstallerCommand(raw.uninstall, id, "uninstall") }),
      cleanup,
      marker,
      ...(raw.license === undefined ? {} : { license: text(raw.license, `installer "${id}" license`) }),
    };
  }
  return installers;
}

function validateFileRegistry(value: unknown, label: "rule" | "agent"): Record<string, FileRegistryEntry> {
  if (!isObject(value)) throw new Error(`[opencode-manager] Registry ${label}s must be an object`);
  const entries: Record<string, FileRegistryEntry> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error(`[opencode-manager] Invalid ${label} id "${id}"`);
    entries[id] = {
      title: text(raw.title, `${label} "${id}" title`),
      description: text(raw.description, `${label} "${id}" description`),
      tags: stringList(raw.tags ?? [], `${label} "${id}" tags`),
      path: safeRelativePath(raw.path, `${label} "${id}" path`),
    };
  }
  return entries;
}

function validateAgentRegistry(value: unknown): Record<string, AgentRegistryEntry> {
  const base = validateFileRegistry(value, "agent");
  const rawEntries = value as JsonObject;
  const entries: Record<string, AgentRegistryEntry> = {};
  for (const [id, entry] of Object.entries(base)) {
    const type = (rawEntries[id] as JsonObject).type;
    if (type !== "single" && type !== "team") {
      throw new Error(`[opencode-manager] Agent "${id}" type must be single or team`);
    }
    entries[id] = { ...entry, type };
  }
  return entries;
}

export async function loadCatalog(options: Pick<ManagerOptions, "catalogPath"> = {}): Promise<RegistryCatalog> {
  return loadCatalogInternal(options);
}

async function loadCatalogInternal(options: Pick<ManagerOptions, "catalogPath">): Promise<LoadedCatalog> {
  const file = resolve(options.catalogPath ?? DEFAULT_CATALOG_PATH);
  const value = parseJsonc(file, await readFile(file, "utf8"));
  if (value.version !== 1) throw new Error("[opencode-manager] Registry version must be 1");
  if (!isObject(value.mcps)) throw new Error("[opencode-manager] Registry mcps must be an object");
  if (!isObject(value.plugins ?? {})) throw new Error("[opencode-manager] Registry plugins must be an object");
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

  const installers = validateInstallerRegistry(value.installers ?? {});

  const plugins: Record<string, PluginRegistryEntry> = {};
  const pluginPackages = new Set<string>();
  for (const [id, raw] of Object.entries((value.plugins ?? {}) as JsonObject)) {
    if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error(`[opencode-manager] Invalid plugin id "${id}"`);
    const packageName = text(raw.package, `plugin "${id}" package`);
    if (pluginPackages.has(packageName)) {
      throw new Error(`[opencode-manager] Duplicate plugin package "${packageName}"`);
    }
    pluginPackages.add(packageName);
    plugins[id] = {
      title: text(raw.title, `plugin "${id}" title`),
      description: text(raw.description, `plugin "${id}" description`),
      tags: stringList(raw.tags ?? [], `plugin "${id}" tags`),
      package: packageName,
    };
  }

  const skillSources: Record<string, SkillSource> = {};
  for (const [id, raw] of Object.entries(value.skillSources)) {
    if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error(`[opencode-manager] Invalid skill source id "${id}"`);
    if (raw.ignoreSymlinks !== undefined && typeof raw.ignoreSymlinks !== "boolean") {
      throw new Error(`[opencode-manager] Skill source "${id}" ignoreSymlinks must be boolean`);
    }
    const base = {
      title: text(raw.title, `skill source "${id}" title`),
      skillsPath: safeRelativePath(raw.skillsPath ?? ".", `skill source "${id}" skillsPath`),
      ...(raw.license === undefined ? {} : { license: text(raw.license, `skill source "${id}" license`) }),
      ...(raw.ignoreSymlinks === undefined ? {} : { ignoreSymlinks: raw.ignoreSymlinks }),
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

  const rules = validateFileRegistry(value.rules ?? {}, "rule");
  const agents = validateAgentRegistry(value.agents ?? {});

  const profiles: RegistryProfile[] = [];
  const profileIDs = new Set<string>();
  for (const raw of value.profiles) {
    if (!isObject(raw)) throw new Error("[opencode-manager] Every profile must be an object");
    const id = text(raw.id, "profile id");
    if (!ID_PATTERN.test(id) || profileIDs.has(id))
      throw new Error(`[opencode-manager] Invalid or duplicate profile "${id}"`);
    profileIDs.add(id);
    const profileMcps = stringList(raw.mcps ?? [], `profile "${id}" mcps`);
    for (const mcp of profileMcps) {
      if (!mcps[mcp]) throw new Error(`[opencode-manager] Profile "${id}" references unknown MCP "${mcp}"`);
    }
    if (!Array.isArray(raw.skills)) throw new Error(`[opencode-manager] Profile "${id}" skills must be an array`);
    const skills = raw.skills.map((item, index): ProfileSkillRef => {
      if (!isObject(item)) throw new Error(`[opencode-manager] Profile "${id}" skill ${index} must be an object`);
      const source = text(item.source, `profile "${id}" skill source`);
      if (!skillSources[source])
        throw new Error(`[opencode-manager] Profile "${id}" references unknown skill source "${source}"`);
      return { source, path: safeRelativePath(item.path, `profile "${id}" skill path`) };
    });
    const profileRules = stringList(raw.rules ?? [], `profile "${id}" rules`);
    for (const rule of profileRules) {
      if (!own(rules, rule)) throw new Error(`[opencode-manager] Profile "${id}" references unknown rule "${rule}"`);
    }
    const profileAgents = stringList(raw.agents ?? [], `profile "${id}" agents`);
    for (const agent of profileAgents) {
      if (!own(agents, agent))
        throw new Error(`[opencode-manager] Profile "${id}" references unknown agent "${agent}"`);
    }
    profiles.push({
      id,
      title: text(raw.title, `profile "${id}" title`),
      description: text(raw.description, `profile "${id}" description`),
      tags: stringList(raw.tags ?? [], `profile "${id}" tags`),
      mcps: profileMcps,
      skills,
      rules: profileRules,
      agents: profileAgents,
    });
  }

  return { version: 1, file, root: dirname(file), mcps, plugins, installers, skillSources, rules, agents, profiles };
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
  const instructionsDir = await canonicalDirectory(join(configDir, "instructions"));
  const agentsDir = await canonicalDirectory(join(configDir, "agents"));
  if (
    !isWithin(managerDir, configDir) ||
    !isWithin(skillsDir, configDir) ||
    !isWithin(instructionsDir, configDir) ||
    !isWithin(agentsDir, configDir)
  ) {
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
      const info = await lstat(candidate);
      if (info.isSymbolicLink() || !info.isFile()) {
        throw new Error(`[opencode-manager] Project config must be a regular non-symlink file: ${candidate}`);
      }
      const canonical = await realpath(candidate);
      if (canonical !== resolve(candidate) || !isWithin(canonical, root)) {
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
    instructionsDir,
    agentsDir,
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
  return { version: 1, mcps: {}, plugins: {}, skills: {}, rules: {}, agents: {} };
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
  if (value.rules !== undefined && !isObject(value.rules)) {
    throw new Error(`[opencode-manager] Invalid manager rule state in ${context.stateFile}`);
  }
  if (value.plugins !== undefined && !isObject(value.plugins)) {
    throw new Error(`[opencode-manager] Invalid manager plugin state in ${context.stateFile}`);
  }
  if (value.agents !== undefined && !isObject(value.agents)) {
    throw new Error(`[opencode-manager] Invalid manager agent state in ${context.stateFile}`);
  }
  const plugins: Record<string, ManagedPluginState> = {};
  for (const [id, raw] of Object.entries((value.plugins ?? {}) as JsonObject)) {
    if (!ID_PATTERN.test(id) || !isObject(raw))
      throw new Error(`[opencode-manager] Invalid managed plugin state "${id}"`);
    plugins[id] = { package: text(raw.package, `managed plugin "${id}" package`) };
  }
  const rules: Record<string, ManagedRuleState> = {};
  for (const [id, raw] of Object.entries((value.rules ?? {}) as JsonObject)) {
    if (!ID_PATTERN.test(id) || !isObject(raw))
      throw new Error(`[opencode-manager] Invalid managed rule state "${id}"`);
    rules[id] = {
      title: typeof raw.title === "string" && raw.title.trim() ? raw.title : id,
      description:
        typeof raw.description === "string" && raw.description.trim() ? raw.description : `Managed rule ${id}`,
      tags: raw.tags === undefined ? [] : stringList(raw.tags, `managed rule "${id}" tags`),
      path: raw.path === undefined ? `rules/${id}.md` : safeRelativePath(raw.path, `managed rule "${id}" path`),
      digest: text(raw.digest, `managed rule "${id}" digest`),
      configFile:
        raw.configFile === undefined
          ? await inferLegacyRuleConfigFile(context, id)
          : safeRelativePath(raw.configFile, `managed rule "${id}" configFile`),
    };
  }
  const agents: Record<string, ManagedAgentState> = {};
  for (const [id, raw] of Object.entries((value.agents ?? {}) as JsonObject)) {
    if (!ID_PATTERN.test(id) || !isObject(raw))
      throw new Error(`[opencode-manager] Invalid managed agent state "${id}"`);
    const digest = text(raw.digest, `managed agent "${id}" digest`);
    let type: AgentRegistryEntry["type"];
    if (raw.type === "single" || raw.type === "team") {
      type = raw.type;
    } else {
      const [single, team] = await Promise.all([
        inspectFile(agentDestination(context, id, "single")),
        inspectTree(agentDestination(context, id, "team"), `Managed agent team "${id}"`),
      ]);
      const matches = [
        single.kind === "file" && single.digest === digest ? "single" : undefined,
        team.kind === "directory" && team.digest === digest ? "team" : undefined,
      ].filter((item): item is AgentRegistryEntry["type"] => item !== undefined);
      if (matches.length === 1) type = matches[0]!;
      else if (single.kind === "absent" && team.kind === "absent") type = "single";
      else throw new Error(`[opencode-manager] Cannot safely infer legacy managed agent "${id}" type from its digest`);
    }
    let members = Number.isInteger(raw.members) && (raw.members as number) > 0 ? (raw.members as number) : 1;
    if (raw.members === undefined && type === "team") {
      const destination = agentDestination(context, id, "team");
      const inspection = await inspectTree(destination, `Managed agent team "${id}"`);
      if (inspection.kind === "directory") {
        members = (await collectTree(destination, `Managed agent team "${id}"`)).filter((item) => item.content).length;
      }
    }
    agents[id] = {
      type,
      title: typeof raw.title === "string" && raw.title.trim() ? raw.title : id,
      description:
        typeof raw.description === "string" && raw.description.trim() ? raw.description : `Managed agent ${id}`,
      tags: raw.tags === undefined ? [] : stringList(raw.tags, `managed agent "${id}" tags`),
      path:
        raw.path === undefined
          ? `agents/${id}${type === "single" ? ".md" : ""}`
          : safeRelativePath(raw.path, `managed agent "${id}" path`),
      digest,
      members,
    };
  }
  return {
    version: 1,
    mcps: value.mcps as Record<string, ManagedMcpState>,
    plugins,
    skills: value.skills as Record<string, ManagedSkillState>,
    rules,
    agents,
  };
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
    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        return false;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ESRCH") return false;
      }
    } else if (age < LOCK_STALE_MS) {
      return false;
    }
    const current = await readFile(file, "utf8");
    if (current !== source) return false;
    await unlink(file);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw error;
  }
}

async function withLockFile<T>(file: string, fn: () => Promise<T>): Promise<T> {
  await mkdir(dirname(file), { recursive: true });
  const started = Date.now();
  const token = randomUUID();
  let handle: Awaited<ReturnType<typeof open>> | undefined;
  while (!handle) {
    try {
      handle = await open(file, "wx", 0o600);
      await handle.writeFile(`${process.pid}\n${Date.now()}\n${token}\n`);
    } catch (error) {
      if (handle) {
        await handle.close().catch(() => undefined);
        handle = undefined;
        await unlink(file).catch(() => undefined);
      }
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      if (await reclaimStaleLock(file)) continue;
      if (Date.now() - started >= LOCK_TIMEOUT_MS) {
        throw new Error(`[opencode-manager] Timed out waiting for lock ${file}`);
      }
      await Bun.sleep(50);
    }
  }
  try {
    return await fn();
  } finally {
    await handle.close();
    try {
      const source = await readFile(file, "utf8");
      if (source.split(/\r?\n/)[2] === token) await unlink(file);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
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
  return withLockFile(context.lockFile, fn);
}

async function readConfigFile(file: string): Promise<ProjectConfig> {
  try {
    const [source, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
    const normalized = source.trim() === "" ? EMPTY_PROJECT_CONFIG : source;
    return { file, source: normalized, value: parseJsonc(file, normalized), mode: info.mode & 0o777 };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { file, source: EMPTY_PROJECT_CONFIG, value: parseJsonc(file, EMPTY_PROJECT_CONFIG) };
  }
}

async function readProjectConfig(context: ProjectContext): Promise<ProjectConfig> {
  return readConfigFile(context.configFile);
}

function statePath(root: string, file: string): string {
  const path = relative(root, file).split(sep).join("/");
  if (path === "" || path === ".." || path.startsWith("../")) {
    throw new Error(`[opencode-manager] Managed state path escapes project root: ${file}`);
  }
  return path;
}

async function resolveRuleConfigFile(context: ProjectContext, path: string, label: string): Promise<string> {
  const normalized = safeRelativePath(path, label);
  const file = resolve(context.root, normalized);
  if (!isWithin(file, context.root)) throw new Error(`[opencode-manager] ${label} escapes project root`);
  const supported = new Set(
    [
      join(context.configDir, "opencode.jsonc"),
      join(context.configDir, "opencode.json"),
      join(context.root, "opencode.jsonc"),
      join(context.root, "opencode.json"),
    ].map((candidate) => resolve(candidate)),
  );
  if (!supported.has(file)) throw new Error(`[opencode-manager] ${label} is not a supported OpenCode project config`);
  const parent = dirname(file);
  const canonicalParent = await realpath(parent);
  if (canonicalParent !== parent || !isWithin(canonicalParent, context.root)) {
    throw new Error(`[opencode-manager] ${label} parent changed or escapes project root`);
  }
  try {
    const info = await lstat(file);
    if (info.isSymbolicLink() || !info.isFile() || (await realpath(file)) !== file) {
      throw new Error(`[opencode-manager] ${label} changed or is not a regular project config`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  return file;
}

async function inferLegacyRuleConfigFile(context: ProjectContext, id: string): Promise<string> {
  const candidates = [
    join(context.configDir, "opencode.jsonc"),
    join(context.configDir, "opencode.json"),
    join(context.root, "opencode.jsonc"),
    join(context.root, "opencode.json"),
  ];
  const instruction = ruleInstruction(id);
  const matches: string[] = [];
  for (const candidate of candidates) {
    const path = statePath(context.root, candidate);
    const file = await resolveRuleConfigFile(context, path, `legacy rule "${id}" configFile`);
    const config = await readConfigFile(file);
    if (projectInstructions(config).includes(instruction)) matches.push(path);
  }
  if (matches.length > 1) {
    throw new Error(`[opencode-manager] Legacy managed rule "${id}" instruction exists in multiple project configs`);
  }
  return matches[0] ?? statePath(context.root, context.configFile);
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
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) => registryValueMatches(item, actual[index]))
    );
  }
  if (isObject(expected)) {
    if (!isObject(actual)) return false;
    const expectedKeys = Object.keys(expected)
      .filter((key) => key !== "enabled")
      .sort();
    const actualKeys = Object.keys(actual)
      .filter((key) => key !== "enabled")
      .sort();
    return (
      expectedKeys.length === actualKeys.length &&
      expectedKeys.every((key, index) => key === actualKeys[index] && registryValueMatches(expected[key], actual[key]))
    );
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
  const enabled =
    isObject(raw) && typeof raw.enabled === "boolean"
      ? raw.enabled
      : isObject(inherited) && typeof inherited.enabled === "boolean"
        ? inherited.enabled
        : entry.config.enabled === true;
  const ownership = managed
    ? "manager"
    : raw !== undefined
      ? "project"
      : inherited !== undefined
        ? "inherited"
        : "absent";
  if (candidate && !matchesMcpRegistry(entry, candidate)) {
    return { enabled, status: "conflict", ownership };
  }
  if (managed && isObject(raw) && mcpHash(raw) !== managed.appliedHash) {
    return { enabled, status: "conflict", ownership };
  }
  if (!candidate && raw !== undefined) return { enabled, status: "conflict", ownership };
  return {
    enabled,
    status: enabled ? "enabled" : raw === undefined && inherited === undefined ? "absent" : "disabled",
    ownership,
  };
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
          modify(config.source, ["mcp", id, "enabled"], enabled, {
            formattingOptions: { insertSpaces: true, tabSize: 2 },
          }),
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
          modify(config.source, ["mcp", id, "enabled"], enabled, {
            formattingOptions: { insertSpaces: true, tabSize: 2 },
          }),
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

function pluginSpecifier(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "string" &&
    value[0].trim() !== "" &&
    isObject(value[1])
  ) {
    return value[0];
  }
  return undefined;
}

function projectPlugins(config: ProjectConfig): unknown[] {
  if (config.value.plugin === undefined) return [];
  if (!Array.isArray(config.value.plugin) || config.value.plugin.some((value) => !pluginSpecifier(value))) {
    throw new Error(
      `[opencode-manager] Project config "plugin" must be an array of package strings or [package, options] tuples`,
    );
  }
  return [...config.value.plugin];
}

function matchesPluginPackage(value: unknown, packageName: string): boolean {
  const specifier = pluginSpecifier(value);
  return specifier === packageName || specifier?.startsWith(`${packageName}@`) === true;
}

function exactPluginPackage(value: unknown, packageName: string): boolean {
  return typeof value === "string" && value === packageName;
}

function matchingPluginIndices(values: readonly unknown[], packageName: string): number[] {
  const indices: number[] = [];
  for (let index = 0; index < values.length; index += 1) {
    if (matchesPluginPackage(values[index], packageName)) indices.push(index);
  }
  return indices;
}

function managedPluginIndices(
  values: readonly unknown[],
  packageName: string,
  managed: ManagedPluginState | undefined,
): number[] {
  const packageNames = managed && managed.package !== packageName ? [packageName, managed.package] : [packageName];
  return values.flatMap((value, index) =>
    packageNames.some((candidate) => matchesPluginPackage(value, candidate)) ? [index] : [],
  );
}

function effectivePluginMatches(options: ManagerOptions, packageName: string): unknown[] {
  return (options.effectivePlugin ?? []).filter((value) => matchesPluginPackage(value, packageName));
}

export async function listPlugins(options: ManagerOptions): Promise<PluginStatus[]> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const [config, state] = await Promise.all([readProjectConfig(context), readState(context)]);
  const values = projectPlugins(config);
  return Object.entries(catalog.plugins).map(([id, entry]) => {
    const managed = state.plugins[id];
    const rawMatches = managedPluginIndices(values, entry.package, managed).map((index) => values[index]);
    const inheritedMatches = rawMatches.length === 0 ? effectivePluginMatches(options, entry.package) : [];
    const candidate = rawMatches[0] ?? inheritedMatches[0];
    const ownership = managed
      ? "manager"
      : rawMatches.length > 0
        ? "project"
        : inheritedMatches.length > 0
          ? "inherited"
          : "absent";
    const conflict =
      rawMatches.length > 1 ||
      inheritedMatches.length > 1 ||
      (candidate !== undefined && !exactPluginPackage(candidate, entry.package)) ||
      (managed !== undefined &&
        (managed.package !== entry.package ||
          rawMatches.length !== 1 ||
          !exactPluginPackage(rawMatches[0], entry.package)));
    return {
      id,
      ...entry,
      enabled: candidate !== undefined,
      status: conflict ? "conflict" : candidate === undefined ? "absent" : "enabled",
      ownership,
    };
  });
}

async function backupPlugin(context: ProjectContext, id: string, values: readonly unknown[]): Promise<void> {
  if (values.length === 0) return;
  const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
  const directory = await ensureContainedDirectory(join(backupRoot, "plugins"), backupRoot, "plugin backup");
  const file = join(directory, `${id}-${Date.now()}-${randomUUID()}.json`);
  await writeAtomic(file, `${JSON.stringify(values, null, 2)}\n`, 0o600);
}

function removeProjectPlugins(source: string, indices: readonly number[]): string {
  let updated = source;
  for (const index of [...indices].sort((a, b) => b - a)) {
    updated = applyEdits(
      updated,
      modify(updated, ["plugin", index], undefined, { formattingOptions: { insertSpaces: true, tabSize: 2 } }),
    );
  }
  return updated;
}

function appendProjectPlugin(config: ProjectConfig, source: string, packageName: string): string {
  const path = config.value.plugin === undefined ? ["plugin"] : ["plugin", -1];
  const value = config.value.plugin === undefined ? [packageName] : packageName;
  return applyEdits(source, modify(source, path, value, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
}

export async function setPluginEnabled(
  options: ManagerOptions,
  id: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<PluginStatus> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const entry = catalog.plugins[id];
  if (!entry) throw new Error(`[opencode-manager] Unknown plugin "${id}"`);

  await withProjectLock(context, async () => {
    const [config, state] = await Promise.all([readProjectConfig(context), readState(context)]);
    const values = projectPlugins(config);
    const managed = state.plugins[id];
    const indices = managedPluginIndices(values, entry.package, managed);
    const rawMatches = indices.map((index) => values[index]);
    const inheritedMatches = indices.length === 0 ? effectivePluginMatches(options, entry.package) : [];
    const exactLocal = indices.length === 1 && exactPluginPackage(rawMatches[0], entry.package);
    let nextSource = config.source;

    if (enabled) {
      if (managed) {
        if (indices.length === 0 && inheritedMatches.length > 0) {
          if (!mutation.override) {
            throw new Error(`[opencode-manager] Plugin "${id}" was modified after manager installation`);
          }
          if (inheritedMatches.length !== 1 || !exactPluginPackage(inheritedMatches[0], entry.package)) {
            throw new Error(
              `[opencode-manager] Inherited plugin "${id}" conflicts and cannot be overridden project-locally`,
            );
          }
          delete state.plugins[id];
        } else if (managed.package !== entry.package || !exactLocal) {
          if (!mutation.override) {
            throw new Error(`[opencode-manager] Plugin "${id}" was modified after manager installation`);
          }
          await backupPlugin(context, id, rawMatches);
          nextSource = appendProjectPlugin(config, removeProjectPlugins(nextSource, indices), entry.package);
          state.plugins[id] = { package: entry.package };
        } else {
          state.plugins[id] = { package: entry.package };
        }
      } else if (indices.length > 0) {
        if (!exactLocal) {
          if (!mutation.override) {
            throw new Error(`[opencode-manager] Plugin "${id}" conflicts with the registry package`);
          }
          await backupPlugin(context, id, rawMatches);
          nextSource = appendProjectPlugin(config, removeProjectPlugins(nextSource, indices), entry.package);
          state.plugins[id] = { package: entry.package };
        }
      } else if (inheritedMatches.length > 0) {
        if (inheritedMatches.length !== 1 || !exactPluginPackage(inheritedMatches[0], entry.package)) {
          throw new Error(
            `[opencode-manager] Inherited plugin "${id}" conflicts and cannot be overridden project-locally`,
          );
        }
      } else {
        nextSource = appendProjectPlugin(config, nextSource, entry.package);
        state.plugins[id] = { package: entry.package };
      }
    } else if (managed) {
      if (indices.length === 0 && inheritedMatches.length > 0) {
        throw new Error(`[opencode-manager] Inherited plugin "${id}" cannot be disabled from this project`);
      }
      if (managed.package !== entry.package || !exactLocal) {
        if (!mutation.override) {
          throw new Error(`[opencode-manager] Plugin "${id}" was modified after manager installation`);
        }
        await backupPlugin(context, id, rawMatches);
      }
      nextSource = removeProjectPlugins(nextSource, indices);
      delete state.plugins[id];
    } else if (indices.length > 0) {
      if (!exactLocal && !mutation.override) {
        throw new Error(`[opencode-manager] Plugin "${id}" conflicts with the registry package`);
      }
      await backupPlugin(context, id, rawMatches);
      nextSource = removeProjectPlugins(nextSource, indices);
    } else if (inheritedMatches.length > 0) {
      throw new Error(`[opencode-manager] Inherited plugin "${id}" cannot be disabled from this project`);
    }

    if (nextSource !== config.source) await writeAtomic(context.configFile, nextSource, config.mode);
    await writeState(context, state);
  });

  const updated = (await listPlugins(options)).find((plugin) => plugin.id === id);
  if (!updated) throw new Error(`[opencode-manager] Plugin "${id}" disappeared from the registry`);
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
    let stdout = "";
    let stderr = "";
    const append = (current: string, chunk: Buffer): string =>
      `${current}${chunk.toString("utf8")}`.slice(-MAX_COMMAND_OUTPUT_CHARS);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });
    const timer = setTimeout(() => child.kill("SIGTERM"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      rejectPromise(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolvePromise(stdout.trim());
        return;
      }
      const detail = stderr.trim();
      rejectPromise(new Error(`[opencode-manager] git ${args[0] ?? "command"} failed${detail ? `: ${detail}` : ""}`));
    });
  });
}

interface RegistrySyncMetadata {
  repository: string;
  ref: string;
  revision: string;
  checkedAt: number;
}

function validateRegistryRef(value: string): string {
  const ref = value.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(ref) || ref.includes("..") || ref.endsWith("/") || ref.endsWith(".")) {
    throw new Error(`[opencode-manager] Invalid registry ref "${value}"`);
  }
  return ref;
}

async function readRegistrySyncMetadata(file: string): Promise<RegistrySyncMetadata | undefined> {
  try {
    const value = JSON.parse(await readFile(file, "utf8")) as unknown;
    if (
      !isObject(value) ||
      typeof value.repository !== "string" ||
      typeof value.ref !== "string" ||
      typeof value.revision !== "string" ||
      !REVISION_PATTERN.test(value.revision) ||
      typeof value.checkedAt !== "number" ||
      !Number.isFinite(value.checkedAt)
    ) {
      return undefined;
    }
    return {
      repository: value.repository,
      ref: value.ref,
      revision: value.revision,
      checkedAt: value.checkedAt,
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT" || error instanceof SyntaxError) return undefined;
    throw error;
  }
}

async function validateCatalogSnapshot(file: string): Promise<void> {
  const catalog = await loadCatalogInternal({ catalogPath: file });
  const localSkillPaths = new Map<string, Set<string>>();
  await Promise.all([
    ...Object.entries(catalog.rules).map(([id, entry]) => registryFile(catalog, entry, `Rule "${id}"`)),
    ...Object.entries(catalog.agents).map(async ([id, entry]) => agentBundle(catalog, id, entry)),
  ]);
  for (const [id, source] of Object.entries(catalog.skillSources)) {
    if (source.type !== "local") continue;
    const sourceRoot = resolve(catalog.root, source.path);
    const canonicalSourceRoot = await realpath(sourceRoot);
    if (!isWithin(canonicalSourceRoot, await realpath(catalog.root))) {
      throw new Error(`[opencode-manager] Local skill source "${id}" escapes the registry root`);
    }
    const skillsRoot = await realpath(resolve(canonicalSourceRoot, source.skillsPath));
    if (!isWithin(skillsRoot, canonicalSourceRoot)) {
      throw new Error(`[opencode-manager] Skill source "${id}" skillsPath escapes its source root`);
    }
    const discovered = await discoverSkillDirectories(skillsRoot, source.ignoreSymlinks);
    const directorySet = new Set(discovered);
    const topLevel = discovered.filter((directory) => {
      let parent = dirname(directory);
      while (isWithin(parent, skillsRoot) && parent !== skillsRoot) {
        if (directorySet.has(parent)) return false;
        parent = dirname(parent);
      }
      return true;
    });
    localSkillPaths.set(
      id,
      new Set(topLevel.map((directory) => relative(skillsRoot, directory).split(sep).join("/") || ".")),
    );
    const names = new Set<string>();
    for (const directory of discovered) {
      const manifest = parseSkillFrontmatter(
        join(directory, "SKILL.md"),
        await readFile(join(directory, "SKILL.md"), "utf8"),
      );
      if (topLevel.includes(directory) && names.has(manifest.name)) {
        throw new Error(`[opencode-manager] Skill source "${id}" has duplicate name "${manifest.name}"`);
      }
      if (topLevel.includes(directory)) names.add(manifest.name);
    }
  }
  for (const profile of catalog.profiles) {
    for (const skill of profile.skills) {
      const paths = localSkillPaths.get(skill.source);
      if (paths && !paths.has(skill.path)) {
        throw new Error(
          `[opencode-manager] Profile "${profile.id}" references missing local skill "${skill.source}:${skill.path}"`,
        );
      }
    }
  }
}

async function validCachedRegistry(
  snapshot: string,
  repository: string,
  ref: string,
  metadata: RegistrySyncMetadata | undefined,
): Promise<RegistrySyncMetadata | undefined> {
  try {
    if (
      !metadata ||
      metadata.repository !== repository ||
      metadata.ref !== ref ||
      metadata.checkedAt > Date.now() + 60_000
    ) {
      return undefined;
    }
    const info = await lstat(snapshot);
    if (info.isSymbolicLink() || !info.isDirectory()) return undefined;
    const [head, status, origin] = await Promise.all([
      runGit(["-C", snapshot, "rev-parse", "HEAD"]),
      runGit(["-C", snapshot, "status", "--porcelain", "--untracked-files=all", "--ignored=matching"]),
      runGit(["-C", snapshot, "remote", "get-url", "origin"]),
      validateCatalogSnapshot(join(snapshot, "registry", "catalog.jsonc")),
    ]);
    if (head !== metadata.revision || status !== "" || origin !== repository) return undefined;
    return metadata;
  } catch {
    return undefined;
  }
}

export async function syncRegistry(
  options: Pick<ManagerOptions, "projectRoot">,
  settings: RegistrySyncSettings = {},
): Promise<RegistrySyncResult> {
  void options;
  const repository = validateRepository(settings.repository ?? DEFAULT_REGISTRY_REPOSITORY, "remote", "registry");
  const ref = validateRegistryRef(settings.ref ?? DEFAULT_REGISTRY_REF);
  const maxAgeMs = settings.maxAgeMs ?? DEFAULT_REGISTRY_MAX_AGE_MS;
  if (!Number.isFinite(maxAgeMs) || maxAgeMs < 0) {
    throw new Error("[opencode-manager] Registry sync maxAgeMs must be a non-negative number");
  }

  const cacheHome = process.env.XDG_CACHE_HOME?.trim() || join(homedir(), ".cache");
  const requestedCacheRoot = resolve(settings.cacheRoot ?? join(cacheHome, "opencode-manager", "registry-sync"));
  await mkdir(requestedCacheRoot, { recursive: true });
  const cacheInfo = await lstat(requestedCacheRoot);
  if (cacheInfo.isSymbolicLink() || !cacheInfo.isDirectory()) {
    throw new Error("[opencode-manager] Registry cache root must be a regular directory");
  }
  const cacheRoot = await realpath(requestedCacheRoot);
  const sourceKey = createHash("sha256").update(`${repository}\0${ref}`).digest("hex").slice(0, 24);
  const syncDir = await ensureContainedDirectory(join(cacheRoot, sourceKey), cacheRoot, "registry sync cache");

  return withLockFile(join(syncDir, "sync.lock"), async () => {
    const metadataFile = join(syncDir, "current.json");
    const current = await readRegistrySyncMetadata(metadataFile);
    const currentSnapshot = current ? join(syncDir, "snapshots", current.revision) : "";
    const cached = currentSnapshot ? await validCachedRegistry(currentSnapshot, repository, ref, current) : undefined;
    const cachedCatalogPath = cached ? join(currentSnapshot, "registry", "catalog.jsonc") : undefined;
    if (!settings.force && cached && Date.now() - cached.checkedAt < maxAgeMs) {
      return { catalogPath: cachedCatalogPath!, revision: cached.revision, status: "current" };
    }

    const temporary = join(syncDir, `checkout.${process.pid}.${randomUUID()}.tmp`);
    try {
      await runGit(["clone", "--filter=blob:none", "--no-checkout", "--no-recurse-submodules", repository, temporary]);
      await runGit(["-C", temporary, "fetch", "--depth", "1", "origin", ref]);
      await runGit(["-C", temporary, "sparse-checkout", "init", "--cone"]);
      await runGit(["-C", temporary, "sparse-checkout", "set", "registry"]);
      await runGit(["-C", temporary, "checkout", "--detach", "FETCH_HEAD"]);
      const [revision] = await Promise.all([
        runGit(["-C", temporary, "rev-parse", "HEAD"]),
        validateCatalogSnapshot(join(temporary, "registry", "catalog.jsonc")),
      ]);
      if (!REVISION_PATTERN.test(revision)) {
        throw new Error(`[opencode-manager] Registry sync resolved invalid commit ${revision}`);
      }
      try {
        await lstat(join(temporary, ".gitmodules"));
        throw new Error("[opencode-manager] Registry repository contains unsupported submodules");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }

      const snapshots = await ensureContainedDirectory(join(syncDir, "snapshots"), syncDir, "registry snapshots");
      const snapshot = join(snapshots, revision);
      if (await pathExists(snapshot)) {
        const existing = await validCachedRegistry(snapshot, repository, ref, {
          repository,
          ref,
          revision,
          checkedAt: Date.now(),
        });
        if (!existing) throw new Error(`[opencode-manager] Invalid existing registry snapshot ${revision}`);
        await rm(temporary, { recursive: true, force: true });
      } else await rename(temporary, snapshot);
      const metadata: RegistrySyncMetadata = { repository, ref, revision, checkedAt: Date.now() };
      await writeAtomic(metadataFile, `${JSON.stringify(metadata, null, 2)}\n`, 0o600);
      return {
        catalogPath: join(snapshot, "registry", "catalog.jsonc"),
        revision,
        status: cached?.revision === revision ? "current" : "updated",
      };
    } catch (error) {
      if (cached) {
        return {
          catalogPath: cachedCatalogPath!,
          revision: cached.revision,
          status: "stale",
          error: error instanceof Error ? error.message : String(error),
        };
      }
      throw error;
    } finally {
      await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
    }
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
    await runGit([
      "clone",
      "--filter=blob:none",
      "--no-checkout",
      "--no-recurse-submodules",
      source.repository,
      temporary,
    ]);
    await runGit(["-C", temporary, "fetch", "--depth", "1", "origin", source.revision]);
    await runGit(["-C", temporary, "checkout", "--detach", "FETCH_HEAD"]);
    const head = await runGit(["-C", temporary, "rev-parse", "HEAD"]);
    if (head !== source.revision)
      throw new Error(`[opencode-manager] Source "${id}" resolved to unexpected commit ${head}`);
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

function installerDataRoot(options: ManagerOptions): string {
  const dataHome = process.env.XDG_DATA_HOME?.trim() || join(homedir(), ".local", "share");
  return resolve(options.installerDataRoot ?? join(dataHome, "opencode-manager"));
}

function installerHome(options: ManagerOptions): string {
  return resolve(options.installerHome ?? homedir());
}

async function ensureInstallerDataRoot(options: ManagerOptions): Promise<string> {
  const root = installerDataRoot(options);
  await mkdir(root, { recursive: true });
  const info = await lstat(root);
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error("[opencode-manager] Installer data root must be a regular directory");
  }
  return realpath(root);
}

async function readInstallerState(options: ManagerOptions): Promise<InstallerState> {
  const root = installerDataRoot(options);
  let canonicalRoot: string;
  try {
    const info = await lstat(root);
    if (info.isSymbolicLink() || !info.isDirectory()) {
      throw new Error("[opencode-manager] Installer data root must be a regular directory");
    }
    canonicalRoot = await realpath(root);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, installers: {} };
    throw error;
  }
  const file = join(canonicalRoot, "installers-state.json");
  try {
    const value = JSON.parse(await readFile(file, "utf8")) as unknown;
    if (!isObject(value) || value.version !== 1) throw new Error("invalid version");
    if (!isObject(value.installers ?? {})) throw new Error("invalid installers");
    const installers: Record<string, ManagedInstallerState> = {};
    for (const [id, raw] of Object.entries(value.installers as JsonObject)) {
      if (!ID_PATTERN.test(id) || !isObject(raw)) throw new Error("invalid installer entry");
      const entry = validateInstallerRegistry({ [id]: raw.entry })[id]!;
      const home = text(raw.home, `managed installer "${id}" home`);
      if (!isAbsolute(home)) throw new Error(`managed installer "${id}" home must be absolute`);
      if (typeof raw.pending !== "boolean") throw new Error(`managed installer "${id}" pending must be boolean`);
      if (!Array.isArray(raw.baseline)) throw new Error(`managed installer "${id}" baseline must be an array`);
      const baseline = raw.baseline.map((item, index): InstallerBaseline => {
        if (!isObject(item)) throw new Error(`managed installer "${id}" baseline ${index} must be an object`);
        const [rule] = validateInstallerCleanup([item], id);
        if (
          !Array.isArray(item.names) ||
          item.names.some(
            (name) =>
              typeof name !== "string" ||
              name === "" ||
              name === "." ||
              name === ".." ||
              name.includes("/") ||
              name.includes("\\"),
          )
        ) {
          throw new Error(`managed installer "${id}" baseline ${index} names are invalid`);
        }
        return { ...rule, names: [...item.names] };
      });
      let marker: InstallerMarkerState | undefined;
      if (raw.marker !== undefined) {
        if (
          !isObject(raw.marker) ||
          (raw.marker.kind !== "file" && raw.marker.kind !== "symlink") ||
          typeof raw.marker.digest !== "string" ||
          !/^[a-f0-9]{64}$/.test(raw.marker.digest) ||
          (raw.marker.target !== undefined && typeof raw.marker.target !== "string")
        ) {
          throw new Error(`managed installer "${id}" marker is invalid`);
        }
        marker = {
          kind: raw.marker.kind,
          digest: raw.marker.digest,
          ...(raw.marker.target === undefined ? {} : { target: raw.marker.target }),
        };
      }
      installers[id] = { entry, home, baseline, pending: raw.pending, ...(marker ? { marker } : {}) };
    }
    return { version: 1, installers };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { version: 1, installers: {} };
    if (error instanceof SyntaxError || error instanceof Error) {
      throw new Error(`[opencode-manager] Invalid installer state in ${file}`);
    }
    throw error;
  }
}

async function writeInstallerState(options: ManagerOptions, state: InstallerState): Promise<void> {
  const root = await ensureInstallerDataRoot(options);
  await writeAtomic(join(root, "installers-state.json"), `${JSON.stringify(state, null, 2)}\n`, 0o600);
}

function installerMarker(home: string, entry: InstallerRegistryEntry): string {
  const marker = resolve(home, entry.marker);
  if (!isWithin(marker, home)) throw new Error(`[opencode-manager] Installer marker escapes HOME`);
  return marker;
}

async function installerSourceRoot(options: ManagerOptions): Promise<string> {
  const root = await ensureInstallerDataRoot(options);
  return ensureContainedDirectory(join(root, "installers"), root, "installer source cache");
}

async function ensureInstallerSource(
  options: ManagerOptions,
  id: string,
  entry: InstallerRegistryEntry,
): Promise<string> {
  const root = await installerSourceRoot(options);
  const installerRoot = await ensureContainedDirectory(join(root, id), root, `installer "${id}" cache`);
  const target = join(installerRoot, entry.revision);
  const valid = async (): Promise<boolean> => {
    try {
      const info = await lstat(target);
      if (info.isSymbolicLink() || !info.isDirectory() || !isWithin(await realpath(target), root)) return false;
      const [head, origin, status] = await Promise.all([
        runGit(["-C", target, "rev-parse", "HEAD"]),
        runGit(["-C", target, "remote", "get-url", "origin"]),
        runGit(["-C", target, "status", "--porcelain", "--untracked-files=no"]),
      ]);
      return head === entry.revision && origin === entry.repository && status === "";
    } catch {
      return false;
    }
  };
  if (await valid()) return target;

  const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
  const previous = `${target}.${process.pid}.${randomUUID()}.old`;
  try {
    await runGit([
      "clone",
      "--filter=blob:none",
      "--no-checkout",
      "--no-recurse-submodules",
      entry.repository,
      temporary,
    ]);
    await runGit(["-C", temporary, "fetch", "--depth", "1", "origin", entry.revision]);
    await runGit(["-C", temporary, "checkout", "--detach", "FETCH_HEAD"]);
    const head = await runGit(["-C", temporary, "rev-parse", "HEAD"]);
    if (head !== entry.revision) {
      throw new Error(`[opencode-manager] Installer "${id}" resolved to unexpected commit ${head}`);
    }
    try {
      await lstat(join(temporary, ".gitmodules"));
      throw new Error(`[opencode-manager] Installer "${id}" contains unsupported submodules`);
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

async function runInstallerCommand(
  command: string[],
  source: string,
  home: string,
  timeoutMs = INSTALLER_COMMAND_TIMEOUT_MS,
): Promise<string> {
  const executable = resolve(source, command[0]!);
  if (!isWithin(executable, source)) throw new Error("[opencode-manager] Installer command escapes its source");
  const [info, canonicalSource, canonicalExecutable] = await Promise.all([
    lstat(executable),
    realpath(source),
    realpath(executable),
  ]);
  if (info.isSymbolicLink() || !info.isFile() || !isWithin(canonicalExecutable, canonicalSource)) {
    throw new Error("[opencode-manager] Installer executable must be a regular file inside its source");
  }
  return new Promise((resolvePromise, rejectPromise) => {
    const detached = process.platform !== "win32";
    const child = spawn(canonicalExecutable, command.slice(1), {
      cwd: canonicalSource,
      detached,
      env: { ...process.env, HOME: home, GSTACK_SETUP_RUNNING: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const append = (current: string, chunk: Buffer): string =>
      `${current}${chunk.toString("utf8")}`.slice(-MAX_COMMAND_OUTPUT_CHARS);
    child.stdout.on("data", (chunk: Buffer) => {
      stdout = append(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = append(stderr, chunk);
    });
    const kill = (signal: NodeJS.Signals): void => {
      if (detached && child.pid) {
        try {
          process.kill(-child.pid, signal);
          return;
        } catch {
          // Fall back to the direct child below.
        }
      }
      child.kill(signal);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      kill("SIGTERM");
      killTimer = setTimeout(() => kill("SIGKILL"), 5_000);
    }, timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      rejectPromise(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (killTimer) clearTimeout(killTimer);
      const output = stdout.trim();
      const detail = stderr.trim();
      if (timedOut) {
        rejectPromise(new Error(`[opencode-manager] Installer command ${command[0]} timed out`));
        return;
      }
      if (code === 0) {
        resolvePromise(output);
        return;
      }
      rejectPromise(
        new Error(
          `[opencode-manager] Installer command ${command[0]} failed${detail ? `: ${detail}` : output ? `: ${output}` : ""}`,
        ),
      );
    });
  });
}

async function installerSourceMatches(
  options: ManagerOptions,
  id: string,
  entry: InstallerRegistryEntry,
): Promise<boolean> {
  const root = await realpath(installerDataRoot(options));
  const source = join(root, "installers", id, entry.revision);
  try {
    const info = await lstat(source);
    if (info.isSymbolicLink() || !info.isDirectory()) return false;
    const [head, origin, status] = await Promise.all([
      runGit(["-C", source, "rev-parse", "HEAD"]),
      runGit(["-C", source, "remote", "get-url", "origin"]),
      runGit(["-C", source, "status", "--porcelain", "--untracked-files=no"]),
    ]);
    return head === entry.revision && origin === entry.repository && status === "";
  } catch {
    return false;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

async function installerMarkerState(path: string): Promise<InstallerMarkerState> {
  const [info, targetInfo] = await Promise.all([lstat(path), stat(path)]);
  if ((!info.isFile() && !info.isSymbolicLink()) || !targetInfo.isFile()) {
    throw new Error(`[opencode-manager] Installer marker must resolve to a regular file: ${path}`);
  }
  const digest = hash(await readFile(path));
  return info.isSymbolicLink() ? { kind: "symlink", digest, target: await realpath(path) } : { kind: "file", digest };
}

async function installerMarkerMatches(path: string, expected: InstallerMarkerState): Promise<boolean> {
  try {
    const current = await installerMarkerState(path);
    return current.kind === expected.kind && current.digest === expected.digest && current.target === expected.target;
  } catch {
    return false;
  }
}

async function canonicalInstallerHome(options: ManagerOptions): Promise<string> {
  const home = installerHome(options);
  await mkdir(home, { recursive: true });
  const info = await lstat(home);
  if (info.isSymbolicLink() || !info.isDirectory())
    throw new Error("[opencode-manager] Installer HOME must be a directory");
  return realpath(home);
}

async function installerCleanupDirectory(home: string, rule: InstallerCleanupRule): Promise<string | undefined> {
  const canonicalHome = await realpath(home);
  const directory = resolve(home, rule.directory);
  if (!isWithin(directory, home)) throw new Error("[opencode-manager] Installer cleanup escapes HOME");
  let info;
  try {
    info = await lstat(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(`[opencode-manager] Installer cleanup directory is not a regular directory: ${directory}`);
  }
  const canonicalDirectory = await realpath(directory);
  if (!isWithin(canonicalDirectory, canonicalHome)) {
    throw new Error("[opencode-manager] Installer cleanup directory escapes HOME");
  }
  return canonicalDirectory;
}

async function captureInstallerBaseline(
  home: string,
  rules: readonly InstallerCleanupRule[],
): Promise<InstallerBaseline[]> {
  return Promise.all(
    rules.map(async (rule) => {
      const directory = await installerCleanupDirectory(home, rule);
      const names = directory
        ? (await readdir(directory)).filter((name) => name === rule.prefix || name.startsWith(`${rule.prefix}-`))
        : [];
      return { ...rule, names };
    }),
  );
}

async function cleanupInstallerPaths(
  home: string,
  rules: readonly InstallerCleanupRule[],
  baseline: readonly InstallerBaseline[],
): Promise<void> {
  for (const rule of rules) {
    const canonicalDirectory = await installerCleanupDirectory(home, rule);
    if (!canonicalDirectory) continue;
    const previous = baseline.find((item) => item.directory === rule.directory && item.prefix === rule.prefix);
    for (const name of await readdir(canonicalDirectory)) {
      if (name !== rule.prefix && !name.startsWith(`${rule.prefix}-`)) continue;
      if (previous?.names.includes(name)) continue;
      const target = join(canonicalDirectory, name);
      if (!isWithin(target, canonicalDirectory))
        throw new Error("[opencode-manager] Installer cleanup path escapes its directory");
      await rm(target, { recursive: true, force: true });
    }
  }
}

async function skillSourceRoot(catalog: LoadedCatalog, context: ProjectContext, id: string): Promise<string> {
  const source = catalog.skillSources[id];
  if (!source) throw new Error(`[opencode-manager] Unknown skill source "${id}"`);
  const root =
    source.type === "local" ? resolve(catalog.root, source.path) : await ensureGitSource(context, id, source);
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

async function collectTree(root: string, label = "Skill tree"): Promise<TreeEntry[]> {
  const entries: TreeEntry[] = [];
  let bytes = 0;
  async function visit(directory: string, prefix: string): Promise<void> {
    const names = (await readdir(directory)).sort();
    for (const name of names) {
      const absolute = join(directory, name);
      const path = prefix ? `${prefix}/${name}` : name;
      const info = await lstat(absolute);
      if (info.isSymbolicLink()) throw new Error(`[opencode-manager] ${label} contains symlink "${path}"`);
      if (info.isDirectory()) {
        entries.push({ path: `${path}/`, mode: info.mode & 0o777 });
        if (entries.length > MAX_TREE_FILES) throw new Error(`[opencode-manager] ${label} has too many entries`);
        await visit(absolute, path);
        continue;
      }
      if (!info.isFile()) throw new Error(`[opencode-manager] ${label} contains unsupported entry "${path}"`);
      if (info.size > MAX_FILE_BYTES) throw new Error(`[opencode-manager] ${label} file "${path}" is too large`);
      bytes += info.size;
      if (bytes > MAX_TREE_BYTES) throw new Error(`[opencode-manager] ${label} is too large`);
      const content = await readFile(absolute);
      entries.push({ path, mode: info.mode & 0o777, content });
      if (entries.length > MAX_TREE_FILES) throw new Error(`[opencode-manager] ${label} has too many entries`);
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

async function inspectTree(path: string, label = "Skill tree"): Promise<TreeInspection> {
  try {
    const info = await lstat(path);
    if (info.isSymbolicLink() || !info.isDirectory()) return { kind: "unsupported" };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "absent" };
    throw error;
  }
  return { kind: "directory", digest: digestEntries(await collectTree(path, label)) };
}

async function inspectFile(path: string): Promise<FileInspection> {
  try {
    const info = await lstat(path);
    if (info.isSymbolicLink() || !info.isFile()) return { kind: "unsupported" };
    if (info.size > MAX_FILE_BYTES) throw new Error(`[opencode-manager] Managed file "${path}" is too large`);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return { kind: "absent" };
    throw error;
  }
  return { kind: "file", digest: hash(await readFile(path)) };
}

function parseMarkdownFrontmatter(file: string, source: string): { data: JsonObject; content: string } {
  const lines = source.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") throw new Error(`[opencode-manager] Agent ${file} has no YAML frontmatter`);
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`[opencode-manager] Agent ${file} has unterminated YAML frontmatter`);
  const data = parseYaml(lines.slice(1, end).join("\n")) as unknown;
  if (!isObject(data)) throw new Error(`[opencode-manager] Agent ${file} frontmatter must be an object`);
  return {
    data,
    content: lines
      .slice(end + 1)
      .join("\n")
      .trim(),
  };
}

function validateAgentDocument(file: string, source: string, expectedName: string): void {
  const { data, content } = parseMarkdownFrontmatter(file, source);
  text(data.description, `agent ${file} description`);
  if (data.name !== undefined && data.name !== expectedName) {
    throw new Error(`[opencode-manager] Agent ${file} name must match "${expectedName}"`);
  }
  if (data.mode !== undefined && !["subagent", "primary", "all"].includes(String(data.mode))) {
    throw new Error(`[opencode-manager] Agent ${file} has invalid mode`);
  }
  for (const field of ["model", "variant", "prompt"] as const) {
    if (data[field] !== undefined && typeof data[field] !== "string") {
      throw new Error(`[opencode-manager] Agent ${file} ${field} must be a string`);
    }
  }
  for (const field of ["temperature", "top_p"] as const) {
    if (data[field] !== undefined && (typeof data[field] !== "number" || !Number.isFinite(data[field]))) {
      throw new Error(`[opencode-manager] Agent ${file} ${field} must be a finite number`);
    }
  }
  for (const field of ["steps", "maxSteps"] as const) {
    if (data[field] !== undefined && (!Number.isInteger(data[field]) || (data[field] as number) <= 0)) {
      throw new Error(`[opencode-manager] Agent ${file} ${field} must be a positive integer`);
    }
  }
  for (const field of ["disable", "hidden"] as const) {
    if (data[field] !== undefined && typeof data[field] !== "boolean") {
      throw new Error(`[opencode-manager] Agent ${file} ${field} must be boolean`);
    }
  }
  if (
    data.color !== undefined &&
    (typeof data.color !== "string" ||
      (!/^#[0-9a-fA-F]{6}$/.test(data.color) &&
        !["primary", "secondary", "accent", "success", "warning", "error", "info"].includes(data.color)))
  ) {
    throw new Error(`[opencode-manager] Agent ${file} has invalid color`);
  }
  if (
    data.tools !== undefined &&
    (!isObject(data.tools) || Object.values(data.tools).some((value) => typeof value !== "boolean"))
  ) {
    throw new Error(`[opencode-manager] Agent ${file} tools must contain boolean values`);
  }
  if (data.options !== undefined && !isObject(data.options)) {
    throw new Error(`[opencode-manager] Agent ${file} options must be an object`);
  }
  if (data.permission !== undefined) validateAgentPermissions(file, data.permission);
  if (content === "") throw new Error(`[opencode-manager] Agent ${file} prompt must not be empty`);
}

function validateAgentPermissions(file: string, value: unknown): void {
  const decisions = new Set(["allow", "ask", "deny"]);
  if (typeof value === "string" && decisions.has(value)) return;
  if (!isObject(value)) throw new Error(`[opencode-manager] Agent ${file} permission must be an action or object`);
  const actionOnly = new Set(["todowrite", "question", "webfetch", "websearch", "doom_loop"]);
  for (const [tool, permission] of Object.entries(value)) {
    if (typeof permission === "string" && decisions.has(permission)) continue;
    if (
      !actionOnly.has(tool) &&
      isObject(permission) &&
      Object.values(permission).every((decision) => typeof decision === "string" && decisions.has(decision))
    ) {
      continue;
    }
    throw new Error(`[opencode-manager] Agent ${file} permission for "${tool}" is invalid`);
  }
}

async function registryFile(catalog: LoadedCatalog, entry: FileRegistryEntry, label: string): Promise<Buffer> {
  const catalogRoot = await realpath(catalog.root);
  const requested = resolve(catalogRoot, entry.path);
  if (!isWithin(requested, catalogRoot))
    throw new Error(`[opencode-manager] ${label} source escapes the registry root`);
  const info = await lstat(requested);
  if (info.isSymbolicLink() || !info.isFile())
    throw new Error(`[opencode-manager] ${label} source must be a regular file`);
  const file = await realpath(requested);
  if (!isWithin(file, catalogRoot)) throw new Error(`[opencode-manager] ${label} source escapes the registry root`);
  if (info.size > MAX_FILE_BYTES) throw new Error(`[opencode-manager] ${label} source is too large`);
  const content = await readFile(file);
  if (content.toString("utf8").trim() === "") throw new Error(`[opencode-manager] ${label} source must not be empty`);
  return content;
}

interface AgentBundle {
  digest: string;
  members: number;
  content?: Buffer;
  entries?: TreeEntry[];
}

async function agentBundle(catalog: LoadedCatalog, id: string, entry: AgentRegistryEntry): Promise<AgentBundle> {
  if (entry.type === "single") {
    const content = await registryFile(catalog, entry, `Agent "${id}"`);
    validateAgentDocument(entry.path, content.toString("utf8"), id);
    return { content, digest: hash(content), members: 1 };
  }

  const catalogRoot = await realpath(catalog.root);
  const requested = resolve(catalogRoot, entry.path);
  if (!isWithin(requested, catalogRoot))
    throw new Error(`[opencode-manager] Agent team "${id}" source escapes the registry root`);
  const info = await lstat(requested);
  if (info.isSymbolicLink() || !info.isDirectory()) {
    throw new Error(`[opencode-manager] Agent team "${id}" source must be a directory`);
  }
  const root = await realpath(requested);
  if (!isWithin(root, catalogRoot))
    throw new Error(`[opencode-manager] Agent team "${id}" source escapes the registry root`);
  const entries = await collectTree(root, `Agent team "${id}"`);
  const files = entries.filter((item) => item.content !== undefined);
  if (files.length < 2) throw new Error(`[opencode-manager] Agent team "${id}" must contain at least two agents`);
  for (const item of files) {
    if (!item.path.endsWith(".md")) {
      throw new Error(`[opencode-manager] Agent team "${id}" contains non-agent file "${item.path}"`);
    }
    const member = item.path.slice(0, -3);
    const expectedName = `${id}/${member}`;
    if (!AGENT_PATH_PATTERN.test(expectedName)) {
      throw new Error(`[opencode-manager] Agent team "${id}" has invalid member path "${item.path}"`);
    }
    validateAgentDocument(item.path, item.content!.toString("utf8"), expectedName);
  }
  return { entries, digest: digestEntries(entries), members: files.length };
}

async function copyEntries(entries: TreeEntry[], destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  for (const entry of entries) {
    const target = join(destination, entry.path);
    if (!isWithin(target, destination))
      throw new Error(`[opencode-manager] Skill entry escapes destination: ${entry.path}`);
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

async function discoverSkillDirectories(root: string, ignoreSymlinks = false): Promise<string[]> {
  const found: string[] = [];
  let visited = 0;
  async function visit(directory: string): Promise<void> {
    for (const name of (await readdir(directory)).sort()) {
      const absolute = join(directory, name);
      const info = await lstat(absolute);
      visited += 1;
      if (visited > 20_000) throw new Error("[opencode-manager] Skill source has too many entries");
      if (info.isSymbolicLink()) {
        if (ignoreSymlinks) continue;
        throw new Error(`[opencode-manager] Skill source contains symlink ${absolute}`);
      }
      if (info.isFile() && name === "SKILL.md") found.push(dirname(absolute));
      if (info.isDirectory()) await visit(absolute);
    }
  }
  await visit(root);
  return found;
}

export async function listInstallers(options: ManagerOptions): Promise<InstallerStatus[]> {
  const [catalog, state] = await Promise.all([loadCatalogInternal(options), readInstallerState(options)]);
  const home = await canonicalInstallerHome(options);
  const ids = [...new Set([...Object.keys(catalog.installers), ...Object.keys(state.installers)])];
  return Promise.all(
    ids.map(async (id) => {
      const registryEntry = catalog.installers[id];
      const managed = state.installers[id];
      if (managed && managed.home !== home) {
        throw new Error(`[opencode-manager] Installer "${id}" state belongs to a different HOME`);
      }
      const entry = registryEntry ?? managed?.entry;
      if (!entry) throw new Error(`[opencode-manager] Installer "${id}" has no registry or state metadata`);
      const markerPath = installerMarker(home, managed?.entry ?? entry);
      const installed = await pathExists(markerPath);
      const sourceCurrent = managed ? await installerSourceMatches(options, id, managed.entry) : false;
      const registryCurrent =
        registryEntry !== undefined &&
        managed !== undefined &&
        registryEntry.repository === managed.entry.repository &&
        registryEntry.revision === managed.entry.revision;
      const markerOwned =
        managed?.marker === undefined || !installed ? true : await installerMarkerMatches(markerPath, managed.marker);
      const external = installed && (!managed || (!managed.pending && !markerOwned));
      const ownership: InstallerStatus["ownership"] = external ? "external" : managed ? "manager" : "absent";
      let status: ResourceStatus = "absent";
      if (external) status = "conflict";
      if (!external && managed && (managed.pending || !installed || !sourceCurrent || !registryCurrent)) {
        status = "modified";
      }
      if (!external && installed && managed && !managed.pending && sourceCurrent && registryCurrent) status = "managed";
      return {
        id,
        ...entry,
        installed,
        status,
        ownership,
      };
    }),
  );
}

export async function setInstallerEnabled(
  options: ManagerOptions,
  id: string,
  enabled: boolean,
): Promise<InstallerStatus> {
  const catalog = await loadCatalogInternal(options);
  const registryEntry = catalog.installers[id];
  const dataRoot = await ensureInstallerDataRoot(options);
  const home = await canonicalInstallerHome(options);
  let removedEntry: InstallerRegistryEntry | undefined;
  await withLockFile(join(dataRoot, "installers.lock"), async () => {
    const state = await readInstallerState(options);
    const managed = state.installers[id];
    if (managed && managed.home !== home) {
      throw new Error(`[opencode-manager] Installer "${id}" state belongs to a different HOME`);
    }
    if (enabled) {
      if (!registryEntry) throw new Error(`[opencode-manager] Unknown installer "${id}"`);
      const markerPath = installerMarker(home, managed?.entry ?? registryEntry);
      const markerPresent = await pathExists(markerPath);
      if (markerPresent && !managed) {
        throw new Error(`[opencode-manager] Installer "${id}" conflicts with an external installation`);
      }
      if (
        markerPresent &&
        managed &&
        !managed.pending &&
        (!managed.marker || !(await installerMarkerMatches(markerPath, managed.marker)))
      ) {
        throw new Error(`[opencode-manager] Installer "${id}" marker was replaced externally`);
      }
      const captured = await captureInstallerBaseline(home, registryEntry.cleanup);
      const baseline = managed
        ? captured.map(
            (item) =>
              managed.baseline.find(
                (previous) => previous.directory === item.directory && previous.prefix === item.prefix,
              ) ?? item,
          )
        : captured;
      if (!managed) {
        state.installers[id] = { entry: registryEntry, home, baseline, pending: true };
        await writeInstallerState(options, state);
      }
      const source = await ensureInstallerSource(options, id, registryEntry);
      await runInstallerCommand(registryEntry.install, source, home);
      if (!(await pathExists(installerMarker(home, registryEntry)))) {
        throw new Error(`[opencode-manager] Installer "${id}" completed without creating its marker`);
      }
      const marker = await installerMarkerState(installerMarker(home, registryEntry));
      state.installers[id] = { entry: registryEntry, home, baseline, pending: false, marker };
      await writeInstallerState(options, state);
      return;
    }

    if (!managed) throw new Error(`[opencode-manager] Installer "${id}" is not managed and cannot be removed`);
    const markerPath = installerMarker(home, managed.entry);
    if (
      !managed.pending &&
      (await pathExists(markerPath)) &&
      (!managed.marker || !(await installerMarkerMatches(markerPath, managed.marker)))
    ) {
      throw new Error(`[opencode-manager] Installer "${id}" marker was replaced externally`);
    }
    removedEntry = managed.entry;
    if (managed.entry.uninstall) {
      const source = await ensureInstallerSource(options, id, managed.entry);
      await runInstallerCommand(managed.entry.uninstall, source, home);
    }
    await cleanupInstallerPaths(home, managed.entry.cleanup, managed.baseline);
    if (await pathExists(installerMarker(home, managed.entry))) {
      throw new Error(`[opencode-manager] Installer "${id}" did not remove its marker`);
    }
    delete state.installers[id];
    await writeInstallerState(options, state);
  });

  const updated = (await listInstallers(options)).find((installer) => installer.id === id);
  if (!updated && removedEntry) {
    return { id, ...removedEntry, installed: false, status: "absent", ownership: "absent" };
  }
  if (!updated) throw new Error(`[opencode-manager] Installer "${id}" disappeared from the registry`);
  return updated;
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
  const discovered = await discoverSkillDirectories(root, source.ignoreSymlinks);
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
      const manifest = parseSkillFrontmatter(
        join(directory, "SKILL.md"),
        await readFile(join(directory, "SKILL.md"), "utf8"),
      );
      const duplicate = names.get(manifest.name);
      if (duplicate)
        throw new Error(
          `[opencode-manager] Skill source "${sourceID}" has duplicate name "${manifest.name}" at ${duplicate} and ${path}`,
        );
      names.set(manifest.name, path);
      return { directory, path, ...manifest };
    }),
  );

  const result: SkillStatus[] = [];
  for (const manifest of manifests) {
    const id = `${sourceID}:${manifest.path}`;
    const managed = state.skills[id];
    const destination = join(context.skillsDir, manifest.name);
    if (!isWithin(destination, context.configDir))
      throw new Error(`[opencode-manager] Invalid skill destination for "${manifest.name}"`);
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

async function skillArchivePath(
  context: ProjectContext,
  name: string,
  reason: "override" | "disabled",
): Promise<string> {
  const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
  const skillsRoot = await ensureContainedDirectory(join(backupRoot, "skills"), backupRoot, "skill backup");
  const directory = await ensureContainedDirectory(join(skillsRoot, reason), skillsRoot, `${reason} skill backup`);
  return join(directory, `${name}-${Date.now()}-${randomUUID()}`);
}

async function replaceSkillTree(entries: TreeEntry[], destination: string, preservedPrevious?: string): Promise<void> {
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

async function replaceManagedFile(content: Buffer, destination: string, preservedPrevious?: string): Promise<void> {
  const temporary = `${destination}.${process.pid}.${randomUUID()}.tmp`;
  const previous = `${destination}.${process.pid}.${randomUUID()}.old`;
  await mkdir(dirname(destination), { recursive: true });
  try {
    await writeFile(temporary, content, { mode: 0o644 });
    const previousTarget = preservedPrevious ?? previous;
    let movedPrevious = false;
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
    if (movedPrevious && !preservedPrevious) await rm(previous, { force: true });
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
    await rm(previous, { force: true }).catch(() => undefined);
  }
}

async function managedArchivePath(
  context: ProjectContext,
  kind: "rules" | "agents",
  id: string,
  reason: "override" | "disabled",
  directory: boolean,
): Promise<string> {
  const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
  const resourceRoot = await ensureContainedDirectory(join(backupRoot, kind), backupRoot, `${kind} backup`);
  const reasonRoot = await ensureContainedDirectory(
    join(resourceRoot, reason),
    resourceRoot,
    `${reason} ${kind} backup`,
  );
  return join(reasonRoot, `${id}-${Date.now()}-${randomUUID()}${directory ? "" : ".md"}`);
}

async function ensureProjectResourceDirectory(
  context: ProjectContext,
  directory: string,
  label: string,
): Promise<void> {
  await mkdir(directory, { recursive: true });
  const canonical = await realpath(directory);
  if (canonical !== directory || !isWithin(canonical, context.configDir)) {
    throw new Error(`[opencode-manager] Project ${label} directory changed or escapes .opencode`);
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
      const conflict =
        owner !== undefined ||
        (current.kind === "directory" && !managed) ||
        (managed && currentDigest !== managed.digest);
      if (conflict && !mutation.override) {
        const reason = owner
          ? `is already managed by ${owner[0]}`
          : managed
            ? "was modified after manager installation"
            : "already exists and is unmanaged";
        throw new Error(
          `[opencode-manager] Skill "${skill.name}" ${reason}; confirm override to preserve and replace it`,
        );
      }
      const entries = await collectTree(sourceDirectory);
      const digest = digestEntries(entries);
      const preserve =
        conflict && current.kind === "directory" ? await skillArchivePath(context, skill.name, "override") : undefined;
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

export async function setSkillSourceEnabled(
  options: ManagerOptions,
  sourceID: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<SkillStatus[]> {
  const skills = await listSkills(options, sourceID);
  const conflict = skills.find((skill) =>
    enabled ? skill.status === "conflict" || skill.status === "modified" : skill.status === "modified",
  );
  if (conflict && !mutation.override) {
    throw new Error(
      `[opencode-manager] Skill source "${sourceID}" has conflicting skill "${conflict.name}"; confirm override to continue`,
    );
  }

  let applied = 0;
  try {
    for (const skill of skills) {
      if (enabled && skill.status === "managed") continue;
      if (!enabled && (skill.status === "absent" || skill.status === "conflict")) continue;
      await setSkillEnabled(options, sourceID, skill.path, enabled, mutation);
      applied += 1;
    }
  } catch (error) {
    if (applied === 0) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(`[opencode-manager] Skill source "${sourceID}" was partially applied: ${message}`), {
      partialApplied: true,
      cause: error,
    });
  }
  return listSkills(options, sourceID);
}

function ruleInstruction(id: string): string {
  return `.opencode/instructions/${id}.md`;
}

function projectInstructions(config: ProjectConfig): string[] {
  return config.value.instructions === undefined
    ? []
    : stringList(config.value.instructions, `project config "instructions"`);
}

function updateProjectInstruction(config: ProjectConfig, instruction: string, enabled: boolean): string {
  const current = projectInstructions(config);
  const formattingOptions = { insertSpaces: true, tabSize: 2 };
  if (enabled) {
    if (current.includes(instruction)) return config.source;
    const path = config.value.instructions === undefined ? ["instructions"] : ["instructions", -1];
    const value = config.value.instructions === undefined ? [instruction] : instruction;
    return applyEdits(config.source, modify(config.source, path, value, { formattingOptions }));
  }
  let source = config.source;
  for (let index = current.length - 1; index >= 0; index -= 1) {
    if (current[index] !== instruction) continue;
    source = applyEdits(source, modify(source, ["instructions", index], undefined, { formattingOptions }));
  }
  return source;
}

export async function listRules(options: ManagerOptions): Promise<RuleStatus[]> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const [selectedConfig, state] = await Promise.all([readProjectConfig(context), readState(context)]);
  const ids = [...new Set([...Object.keys(catalog.rules), ...Object.keys(state.rules)])];
  return Promise.all(
    ids.map(async (id) => {
      const registryEntry = own(catalog.rules, id);
      const managed = own(state.rules, id);
      const entry = registryEntry ?? managed;
      if (!entry) throw new Error(`[opencode-manager] Rule "${id}" has no registry or state metadata`);
      let sourceValid = true;
      if (registryEntry) {
        try {
          await registryFile(catalog, registryEntry, `Rule "${id}"`);
        } catch (error) {
          if (!managed) throw error;
          sourceValid = false;
        }
      }
      const config = managed?.configFile
        ? await readConfigFile(await resolveRuleConfigFile(context, managed.configFile, `rule "${id}" configFile`))
        : selectedConfig;
      const instructions = projectInstructions(config);
      const destination = join(context.instructionsDir, `${id}.md`);
      const current = await inspectFile(destination);
      let status: ResourceStatus;
      if (managed) {
        status =
          sourceValid &&
          current.kind === "file" &&
          current.digest === managed.digest &&
          instructions.includes(ruleInstruction(id))
            ? "managed"
            : "modified";
      } else {
        status = current.kind === "absent" ? "absent" : "conflict";
      }
      return {
        id,
        title: entry.title,
        description: entry.description,
        tags: entry.tags,
        path: entry.path,
        status,
        ownership: managed ? "manager" : current.kind === "absent" ? "absent" : "project",
      };
    }),
  );
}

export async function setRuleEnabled(
  options: ManagerOptions,
  id: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<RuleStatus> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const destination = join(context.instructionsDir, `${id}.md`);
  const instruction = ruleInstruction(id);
  let resultEntry: FileRegistryEntry | undefined;

  await withProjectLock(context, async () => {
    const state = await readState(context);
    const registryEntry = own(catalog.rules, id);
    const managed = own(state.rules, id);
    const entry = registryEntry ?? managed;
    if (!entry) throw new Error(`[opencode-manager] Unknown rule "${id}"`);
    resultEntry = entry;
    const config = managed?.configFile
      ? await readConfigFile(await resolveRuleConfigFile(context, managed.configFile, `rule "${id}" configFile`))
      : await readProjectConfig(context);
    const current = await inspectFile(destination);
    const instructionPresent = projectInstructions(config).includes(instruction);

    if (enabled) {
      if (!registryEntry) throw new Error(`[opencode-manager] Rule "${id}" is no longer available in the registry`);
      const content = await registryFile(catalog, registryEntry, `Rule "${id}"`);
      const digest = hash(content);
      if (current.kind === "unsupported") {
        throw new Error(`[opencode-manager] Rule destination "${id}" is a directory or symlink`);
      }
      const conflict =
        (current.kind === "file" && !managed) ||
        (managed && (current.kind !== "file" || current.digest !== managed.digest || !instructionPresent));
      if (conflict && !mutation.override) {
        const reason = managed ? "was modified after manager installation" : "already exists and is unmanaged";
        throw new Error(`[opencode-manager] Rule "${id}" ${reason}; confirm override to preserve and replace it`);
      }
      await ensureProjectResourceDirectory(context, context.instructionsDir, "instructions");
      const preserve =
        conflict && current.kind === "file"
          ? await managedArchivePath(context, "rules", id, "override", false)
          : undefined;
      if (conflict || current.kind !== "file" || current.digest !== digest) {
        await replaceManagedFile(content, destination, preserve);
      }
      const nextSource = updateProjectInstruction(config, instruction, true);
      if (nextSource !== config.source) await writeAtomic(config.file, nextSource, config.mode);
      state.rules[id] = {
        ...registryEntry,
        digest,
        configFile: statePath(context.root, config.file),
      };
      await writeState(context, state);
      return;
    }

    if (!managed) {
      if (current.kind !== "absent") throw new Error(`[opencode-manager] Refusing to disable unmanaged rule "${id}"`);
      return;
    }
    if (current.kind === "unsupported") {
      throw new Error(`[opencode-manager] Managed rule destination "${id}" became a directory or symlink`);
    }
    if (current.kind === "absent" && !mutation.override) {
      throw new Error(`[opencode-manager] Managed rule "${id}" is missing`);
    }
    if (current.kind === "file" && current.digest !== managed.digest && !mutation.override) {
      throw new Error(`[opencode-manager] Refusing to disable modified rule "${id}" without confirmation`);
    }
    if (!instructionPresent && !mutation.override) {
      throw new Error(
        `[opencode-manager] Refusing to disable rule "${id}" after its instruction reference was modified`,
      );
    }
    if (current.kind === "file") {
      const archive = await managedArchivePath(context, "rules", id, "disabled", false);
      await rename(destination, archive);
    }
    const nextSource = updateProjectInstruction(config, instruction, false);
    if (nextSource !== config.source) await writeAtomic(config.file, nextSource, config.mode);
    delete state.rules[id];
    await writeState(context, state);
  });

  if (!enabled && resultEntry) return { id, ...resultEntry, status: "absent", ownership: "absent" };
  const updated = (await listRules(options)).find((item) => item.id === id);
  if (!updated) throw new Error(`[opencode-manager] Rule "${id}" disappeared from the registry`);
  return updated;
}

function inheritedAgent(options: ManagerOptions, id: string, type: AgentRegistryEntry["type"]): boolean {
  if (type === "single") return options.effectiveAgent?.[id] !== undefined;
  return Object.keys(options.effectiveAgent ?? {}).some((name) => name.startsWith(`${id}/`));
}

function agentDestination(context: ProjectContext, id: string, type: AgentRegistryEntry["type"]): string {
  return join(context.agentsDir, type === "single" ? `${id}.md` : id);
}

export async function listAgents(options: ManagerOptions): Promise<AgentStatus[]> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  const state = await readState(context);
  const ids = [...new Set([...Object.keys(catalog.agents), ...Object.keys(state.agents)])];
  return Promise.all(
    ids.map(async (id) => {
      const registryEntry = own(catalog.agents, id);
      const managed = own(state.agents, id);
      const entry = registryEntry ?? managed;
      if (!entry) throw new Error(`[opencode-manager] Agent resource "${id}" has no registry or state metadata`);
      let bundle: AgentBundle | undefined;
      let sourceValid = true;
      if (registryEntry) {
        try {
          bundle = await agentBundle(catalog, id, registryEntry);
        } catch (error) {
          if (!managed) throw error;
          sourceValid = false;
        }
      }
      const installedType = managed?.type ?? entry.type;
      const destination = agentDestination(context, id, installedType);
      const current =
        installedType === "single"
          ? await inspectFile(destination)
          : await inspectTree(destination, `Agent team "${id}"`);
      const currentDigest = current.kind === "file" || current.kind === "directory" ? current.digest : undefined;
      const inherited = !managed && current.kind === "absent" && inheritedAgent(options, id, entry.type);
      const status: ResourceStatus = managed
        ? sourceValid && managed.type === entry.type && currentDigest === managed.digest
          ? "managed"
          : "modified"
        : current.kind !== "absent" || inherited
          ? "conflict"
          : "absent";
      return {
        id,
        title: entry.title,
        description: entry.description,
        tags: entry.tags,
        path: entry.path,
        type: entry.type,
        members: bundle?.members ?? managed?.members ?? 1,
        status,
        ownership: managed ? "manager" : current.kind !== "absent" ? "project" : inherited ? "inherited" : "absent",
      };
    }),
  );
}

export async function setAgentEnabled(
  options: ManagerOptions,
  id: string,
  enabled: boolean,
  mutation: MutationOptions = {},
): Promise<AgentStatus> {
  const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
  let resultEntry: AgentRegistryEntry | undefined;
  let resultMembers = 1;

  await withProjectLock(context, async () => {
    const state = await readState(context);
    const registryEntry = own(catalog.agents, id);
    const managed = own(state.agents, id);
    const entry = registryEntry ?? managed;
    if (!entry) throw new Error(`[opencode-manager] Unknown agent or team "${id}"`);
    resultEntry = entry;
    resultMembers = managed?.members ?? 1;
    const installedType = managed?.type ?? entry.type;
    const installedDestination = agentDestination(context, id, installedType);
    const current =
      installedType === "single"
        ? await inspectFile(installedDestination)
        : await inspectTree(installedDestination, `Agent team "${id}"`);
    const currentDigest = current.kind === "file" || current.kind === "directory" ? current.digest : undefined;

    if (enabled) {
      if (!registryEntry)
        throw new Error(`[opencode-manager] Agent resource "${id}" is no longer available in the registry`);
      const bundle = await agentBundle(catalog, id, registryEntry);
      resultMembers = bundle.members;
      const typeChanged = managed !== undefined && installedType !== registryEntry.type;
      const destination = agentDestination(context, id, registryEntry.type);
      const target = typeChanged
        ? registryEntry.type === "single"
          ? await inspectFile(destination)
          : await inspectTree(destination, `Agent team "${id}"`)
        : current;
      const targetDigest = target.kind === "file" || target.kind === "directory" ? target.digest : undefined;
      const inherited = !managed && target.kind === "absent" && inheritedAgent(options, id, registryEntry.type);
      if (current.kind === "unsupported") {
        throw new Error(`[opencode-manager] Agent destination "${id}" has the wrong type or is a symlink`);
      }
      if (target.kind === "unsupported") {
        throw new Error(`[opencode-manager] Agent target "${id}" has the wrong type or is a symlink`);
      }
      const conflict =
        typeChanged ||
        inherited ||
        (target.kind !== "absent" && !managed) ||
        (managed && currentDigest !== managed.digest) ||
        (typeChanged && target.kind !== "absent");
      if (conflict && !mutation.override) {
        const reason = inherited
          ? "conflicts with an inherited same-name agent"
          : typeChanged
            ? `changed registry type from ${installedType} to ${registryEntry.type}`
            : managed
              ? "was modified after manager installation"
              : "already exists and is unmanaged";
        throw new Error(
          `[opencode-manager] Agent resource "${id}" ${reason}; confirm override to preserve and replace it`,
        );
      }
      await ensureProjectResourceDirectory(context, context.agentsDir, "agents");
      const preserve =
        (typeChanged ? target : current).kind !== "absent" && conflict
          ? await managedArchivePath(context, "agents", id, "override", registryEntry.type === "team")
          : undefined;
      let migratedArchive: string | undefined;
      if (typeChanged && current.kind !== "absent") {
        migratedArchive = await managedArchivePath(context, "agents", id, "override", installedType === "team");
        await rename(installedDestination, migratedArchive);
      }
      try {
        if (targetDigest !== bundle.digest || (conflict && target.kind !== "absent") || typeChanged) {
          if (registryEntry.type === "single") await replaceManagedFile(bundle.content!, destination, preserve);
          else await replaceSkillTree(bundle.entries!, destination, preserve);
        }
      } catch (error) {
        if (migratedArchive) await rename(migratedArchive, installedDestination).catch(() => undefined);
        throw error;
      }
      state.agents[id] = { ...registryEntry, digest: bundle.digest, members: bundle.members };
      await writeState(context, state);
      return;
    }

    const inherited = !managed && current.kind === "absent" && inheritedAgent(options, id, entry.type);
    if (!managed) {
      if (inherited)
        throw new Error(`[opencode-manager] Cannot disable inherited agent resource "${id}" project-locally`);
      if (current.kind !== "absent")
        throw new Error(`[opencode-manager] Refusing to disable unmanaged agent resource "${id}"`);
      return;
    }
    if (current.kind === "unsupported") {
      throw new Error(`[opencode-manager] Managed agent destination "${id}" changed type or became a symlink`);
    }
    if (current.kind === "absent" && !mutation.override) {
      throw new Error(`[opencode-manager] Managed agent resource "${id}" is missing`);
    }
    if (currentDigest !== undefined && currentDigest !== managed.digest && !mutation.override) {
      throw new Error(`[opencode-manager] Refusing to disable modified agent resource "${id}" without confirmation`);
    }
    if (current.kind !== "absent") {
      const archive = await managedArchivePath(context, "agents", id, "disabled", installedType === "team");
      await rename(installedDestination, archive);
    }
    delete state.agents[id];
    await writeState(context, state);
  });

  if (!enabled && resultEntry) {
    return { id, ...resultEntry, members: resultMembers, status: "absent", ownership: "absent" };
  }
  const updated = (await listAgents(options)).find((item) => item.id === id);
  if (!updated) throw new Error(`[opencode-manager] Agent resource "${id}" disappeared from the registry`);
  return updated;
}

function profileState(
  profile: RegistryProfile,
  mcps: McpStatus[],
  rules: RuleStatus[],
  agents: AgentStatus[],
  skills: Map<string, "absent" | "managed" | "modified">,
): ProfileStatus["status"] {
  const mcpItems = profile.mcps.map((id) => mcps.find((item) => item.id === id)!);
  const ruleItems = profile.rules.map((id) => rules.find((item) => item.id === id)!);
  const agentItems = profile.agents.map((id) => agents.find((item) => item.id === id)!);
  const skillItems = profile.skills.map((item) => skills.get(`${item.source}:${item.path}`) ?? "absent");
  if (
    mcpItems.some((item) => item.status === "conflict") ||
    skillItems.some((status) => status === "modified") ||
    ruleItems.some((item) => item.status === "conflict" || item.status === "modified") ||
    agentItems.some((item) => item.status === "conflict" || item.status === "modified")
  ) {
    return "conflict";
  }
  const enabledCount =
    mcpItems.filter((item) => item.enabled).length +
    skillItems.filter((status) => status === "managed").length +
    ruleItems.filter((item) => item.status === "managed").length +
    agentItems.filter((item) => item.status === "managed").length;
  const total = mcpItems.length + skillItems.length + profile.rules.length + profile.agents.length;
  if (enabledCount === 0) return "disabled";
  if (enabledCount === total) return "enabled";
  return "partial";
}

async function profileSkillStates(
  catalog: LoadedCatalog,
  context: ProjectContext,
  state: ManagerState,
): Promise<Map<string, "absent" | "managed" | "modified">> {
  const ids = [
    ...new Set(catalog.profiles.flatMap((profile) => profile.skills.map((item) => `${item.source}:${item.path}`))),
  ];
  const result = new Map<string, "absent" | "managed" | "modified">();
  await Promise.all(
    ids.map(async (id) => {
      const managed = own(state.skills, id);
      if (!managed) {
        result.set(id, "absent");
        return;
      }
      const destination = join(context.skillsDir, managed.name);
      const current = await inspectTree(destination);
      result.set(id, current.kind === "directory" && current.digest === managed.digest ? "managed" : "modified");
    }),
  );
  return result;
}

export async function listProfiles(options: ManagerOptions): Promise<ProfileStatus[]> {
  const [catalog, context, mcps, rules, agents] = await Promise.all([
    loadCatalogInternal(options),
    projectContext(options.projectRoot),
    listMcps(options),
    listRules(options),
    listAgents(options),
  ]);
  const state = await readState(context);
  const skills = await profileSkillStates(catalog, context, state);
  return catalog.profiles.map((profile) => {
    const enabledResources =
      profile.mcps.filter((id) => mcps.find((item) => item.id === id)?.enabled).length +
      profile.skills.filter((item) => skills.get(`${item.source}:${item.path}`) === "managed").length +
      profile.rules.filter((id) => rules.find((item) => item.id === id)?.status === "managed").length +
      profile.agents.filter((id) => agents.find((item) => item.id === id)?.status === "managed").length;
    return {
      ...profile,
      status: profileState(profile, mcps, rules, agents, skills),
      enabledResources,
      totalResources: profile.mcps.length + profile.skills.length + profile.rules.length + profile.agents.length,
    };
  });
}

export async function getProfile(options: ManagerOptions, profileID: string): Promise<ProfileDetail> {
  const [catalog, profiles, mcps, rules, agents] = await Promise.all([
    loadCatalogInternal(options),
    listProfiles(options),
    listMcps(options),
    listRules(options),
    listAgents(options),
  ]);
  const profile = profiles.find((item) => item.id === profileID);
  if (!profile) throw new Error(`[opencode-manager] Unknown profile "${profileID}"`);
  const refs = catalog.profiles.find((item) => item.id === profileID)!.skills;
  const sourceIDs = [...new Set(refs.map((item) => item.source))];
  const sourceSkills = new Map<string, SkillStatus[]>();
  await Promise.all(sourceIDs.map(async (sourceID) => sourceSkills.set(sourceID, await listSkills(options, sourceID))));
  const skills = refs.map((ref) => {
    const skill = sourceSkills.get(ref.source)?.find((item) => item.path === ref.path);
    if (!skill)
      throw new Error(`[opencode-manager] Profile "${profileID}" references missing skill "${ref.source}:${ref.path}"`);
    return skill;
  });
  const hasConflict =
    mcps.some((item) => profile.mcps.includes(item.id) && item.status === "conflict") ||
    skills.some((item) => item.status === "conflict" || item.status === "modified") ||
    rules.some((item) => profile.rules.includes(item.id) && ["conflict", "modified"].includes(item.status)) ||
    agents.some((item) => profile.agents.includes(item.id) && ["conflict", "modified"].includes(item.status));
  return {
    profile: hasConflict ? { ...profile, status: "conflict" } : profile,
    mcps: profile.mcps.map((id) => mcps.find((item) => item.id === id)!),
    skills,
    rules: profile.rules.map((id) => rules.find((item) => item.id === id)!),
    agents: profile.agents.map((id) => agents.find((item) => item.id === id)!),
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
    throw new Error(
      `[opencode-manager] Profile "${profileID}" has conflicting MCP "${mcpConflict.id}"; confirm override to continue`,
    );
  }
  const skillConflict = detail.skills.find((item) =>
    enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified",
  );
  if (skillConflict && !mutation.override) {
    throw new Error(
      `[opencode-manager] Profile "${profileID}" has conflicting skill "${skillConflict.name}"; confirm override to continue`,
    );
  }
  const ruleConflict = detail.rules.find((item) =>
    enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified",
  );
  if (ruleConflict && !mutation.override) {
    throw new Error(
      `[opencode-manager] Profile "${profileID}" has conflicting rule "${ruleConflict.id}"; confirm override to continue`,
    );
  }
  const agentConflict = detail.agents.find((item) =>
    enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified",
  );
  if (agentConflict && !mutation.override) {
    throw new Error(
      `[opencode-manager] Profile "${profileID}" has conflicting agent resource "${agentConflict.id}"; confirm override to continue`,
    );
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
    for (const rule of detail.rules) {
      if (!enabled && (rule.status === "absent" || rule.status === "conflict")) continue;
      await setRuleEnabled(options, rule.id, enabled, mutation);
      applied += 1;
    }
    for (const agent of detail.agents) {
      if (!enabled && (agent.status === "absent" || agent.status === "conflict")) continue;
      await setAgentEnabled(options, agent.id, enabled, mutation);
      applied += 1;
    }
  } catch (error) {
    if (applied === 0) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw Object.assign(new Error(`[opencode-manager] Profile "${profileID}" was partially applied: ${message}`), {
      partialApplied: true,
      cause: error,
    });
  }
  return getProfile(options, profileID);
}
