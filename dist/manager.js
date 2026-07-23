import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { chmod, lstat, mkdir, open, readFile, readdir, realpath, rename, rm, stat, unlink, writeFile, } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { applyEdits, getNodeValue, modify, parseTree, printParseErrorCode, } from "jsonc-parser";
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
const LOCK_STALE_MS = 5 * 60_000;
function isObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function own(record, key) {
    return Object.hasOwn(record, key) ? record[key] : undefined;
}
function text(value, label) {
    if (typeof value !== "string" || value.trim() === "") {
        throw new Error(`[opencode-manager] ${label} must be a non-empty string`);
    }
    return value;
}
function stringList(value, label) {
    if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
        throw new Error(`[opencode-manager] ${label} must be an array of non-empty strings`);
    }
    return [...value];
}
function propertyNodes(node) {
    const properties = [];
    for (const property of node.children ?? []) {
        const [key, value] = property.children ?? [];
        if (property.type !== "property" || !key || !value || key.type !== "string") {
            throw new Error("[opencode-manager] Invalid JSON object property");
        }
        properties.push({ key, value });
    }
    return properties;
}
function assertUniqueObjectKeys(node, path = "$") {
    if (node.type === "array") {
        for (const child of node.children ?? [])
            assertUniqueObjectKeys(child, `${path}[]`);
        return;
    }
    if (node.type !== "object")
        return;
    const seen = new Set();
    for (const { key, value } of propertyNodes(node)) {
        const name = String(key.value);
        if (seen.has(name))
            throw new Error(`[opencode-manager] Duplicate JSON property "${path}.${name}"`);
        seen.add(name);
        assertUniqueObjectKeys(value, `${path}.${name}`);
    }
}
function parseJsonc(file, source) {
    const errors = [];
    const root = parseTree(source, errors, { allowTrailingComma: true, disallowComments: false });
    if (errors.length > 0) {
        const details = errors
            .map((error) => `${printParseErrorCode(error.error)} at offset ${error.offset}`)
            .join(", ");
        throw new Error(`[opencode-manager] Invalid JSONC in ${file}: ${details}`);
    }
    if (!root || root.type !== "object")
        throw new Error(`[opencode-manager] ${file} must contain an object`);
    assertUniqueObjectKeys(root);
    const value = getNodeValue(root);
    if (!isObject(value))
        throw new Error(`[opencode-manager] ${file} must contain an object`);
    return value;
}
function safeRelativePath(value, label) {
    const path = text(value, label).replaceAll("\\", "/");
    if (isAbsolute(path) || path === ".." || path.startsWith("../") || path.includes("/../")) {
        throw new Error(`[opencode-manager] ${label} must stay inside its registry root`);
    }
    return path.replace(/^\.\//, "").replace(/\/$/, "");
}
function validateMcpConfig(id, input) {
    if (!isObject(input))
        throw new Error(`[opencode-manager] MCP "${id}" config must be an object`);
    const type = input.type;
    if (type !== "local" && type !== "remote") {
        throw new Error(`[opencode-manager] MCP "${id}" type must be local or remote`);
    }
    const allowed = new Set(type === "local"
        ? ["type", "command", "cwd", "environment", "enabled", "timeout"]
        : ["type", "url", "headers", "oauth", "enabled", "timeout"]);
    for (const key of Object.keys(input)) {
        if (!allowed.has(key))
            throw new Error(`[opencode-manager] MCP "${id}" has unsupported field "${key}"`);
    }
    if (type === "local") {
        if (!Array.isArray(input.command) || input.command.length === 0 || input.command.some((item) => typeof item !== "string")) {
            throw new Error(`[opencode-manager] MCP "${id}" command must be a non-empty string array`);
        }
    }
    else {
        text(input.url, `MCP "${id}" url`);
    }
    if (input.enabled !== undefined && typeof input.enabled !== "boolean") {
        throw new Error(`[opencode-manager] MCP "${id}" enabled must be boolean`);
    }
    for (const field of ["environment", "headers"]) {
        const value = input[field];
        if (value === undefined)
            continue;
        if (!isObject(value) || Object.values(value).some((item) => typeof item !== "string")) {
            throw new Error(`[opencode-manager] MCP "${id}" ${field} must contain string values`);
        }
    }
    return structuredClone(input);
}
function validateRepository(value, id) {
    const repository = text(value, `skill source "${id}" repository`);
    let url;
    try {
        url = new URL(repository);
    }
    catch {
        throw new Error(`[opencode-manager] Skill source "${id}" repository must be an HTTPS URL`);
    }
    if (url.protocol !== "https:" || url.username || url.password) {
        throw new Error(`[opencode-manager] Skill source "${id}" repository must be an unauthenticated HTTPS URL`);
    }
    return repository;
}
function validateFileRegistry(value, label) {
    if (!isObject(value))
        throw new Error(`[opencode-manager] Registry ${label}s must be an object`);
    const entries = {};
    for (const [id, raw] of Object.entries(value)) {
        if (!ID_PATTERN.test(id) || !isObject(raw))
            throw new Error(`[opencode-manager] Invalid ${label} id "${id}"`);
        entries[id] = {
            title: text(raw.title, `${label} "${id}" title`),
            description: text(raw.description, `${label} "${id}" description`),
            tags: stringList(raw.tags ?? [], `${label} "${id}" tags`),
            path: safeRelativePath(raw.path, `${label} "${id}" path`),
        };
    }
    return entries;
}
function validateAgentRegistry(value) {
    const base = validateFileRegistry(value, "agent");
    const rawEntries = value;
    const entries = {};
    for (const [id, entry] of Object.entries(base)) {
        const type = rawEntries[id].type;
        if (type !== "single" && type !== "team") {
            throw new Error(`[opencode-manager] Agent "${id}" type must be single or team`);
        }
        entries[id] = { ...entry, type };
    }
    return entries;
}
export async function loadCatalog(options = {}) {
    return loadCatalogInternal(options);
}
async function loadCatalogInternal(options) {
    const file = resolve(options.catalogPath ?? DEFAULT_CATALOG_PATH);
    const value = parseJsonc(file, await readFile(file, "utf8"));
    if (value.version !== 1)
        throw new Error("[opencode-manager] Registry version must be 1");
    if (!isObject(value.mcps))
        throw new Error("[opencode-manager] Registry mcps must be an object");
    if (!isObject(value.skillSources))
        throw new Error("[opencode-manager] Registry skillSources must be an object");
    if (!Array.isArray(value.profiles))
        throw new Error("[opencode-manager] Registry profiles must be an array");
    const mcps = {};
    for (const [id, raw] of Object.entries(value.mcps)) {
        if (!ID_PATTERN.test(id) || !isObject(raw))
            throw new Error(`[opencode-manager] Invalid MCP id "${id}"`);
        mcps[id] = {
            title: text(raw.title, `MCP "${id}" title`),
            description: text(raw.description, `MCP "${id}" description`),
            tags: stringList(raw.tags ?? [], `MCP "${id}" tags`),
            config: validateMcpConfig(id, raw.config),
        };
    }
    const skillSources = {};
    for (const [id, raw] of Object.entries(value.skillSources)) {
        if (!ID_PATTERN.test(id) || !isObject(raw))
            throw new Error(`[opencode-manager] Invalid skill source id "${id}"`);
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
    const rules = validateFileRegistry(value.rules ?? {}, "rule");
    const agents = validateAgentRegistry(value.agents ?? {});
    const profiles = [];
    const profileIDs = new Set();
    for (const raw of value.profiles) {
        if (!isObject(raw))
            throw new Error("[opencode-manager] Every profile must be an object");
        const id = text(raw.id, "profile id");
        if (!ID_PATTERN.test(id) || profileIDs.has(id))
            throw new Error(`[opencode-manager] Invalid or duplicate profile "${id}"`);
        profileIDs.add(id);
        const profileMcps = stringList(raw.mcps ?? [], `profile "${id}" mcps`);
        for (const mcp of profileMcps) {
            if (!mcps[mcp])
                throw new Error(`[opencode-manager] Profile "${id}" references unknown MCP "${mcp}"`);
        }
        if (!Array.isArray(raw.skills))
            throw new Error(`[opencode-manager] Profile "${id}" skills must be an array`);
        const skills = raw.skills.map((item, index) => {
            if (!isObject(item))
                throw new Error(`[opencode-manager] Profile "${id}" skill ${index} must be an object`);
            const source = text(item.source, `profile "${id}" skill source`);
            if (!skillSources[source])
                throw new Error(`[opencode-manager] Profile "${id}" references unknown skill source "${source}"`);
            return { source, path: safeRelativePath(item.path, `profile "${id}" skill path`) };
        });
        const profileRules = stringList(raw.rules ?? [], `profile "${id}" rules`);
        for (const rule of profileRules) {
            if (!own(rules, rule))
                throw new Error(`[opencode-manager] Profile "${id}" references unknown rule "${rule}"`);
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
    return { version: 1, file, root: dirname(file), mcps, skillSources, rules, agents, profiles };
}
function isWithin(target, root) {
    const path = relative(root, target);
    return path === "" || (path !== ".." && !path.startsWith(`..${sep}`) && !isAbsolute(path));
}
async function canonicalDirectory(path) {
    try {
        return await realpath(path);
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
        return resolve(path);
    }
}
async function projectContext(projectRoot) {
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
    if (!isWithin(managerDir, configDir) ||
        !isWithin(skillsDir, configDir) ||
        !isWithin(instructionsDir, configDir) ||
        !isWithin(agentsDir, configDir)) {
        throw new Error("[opencode-manager] Managed project paths must stay inside .opencode");
    }
    const candidates = [
        join(configDir, "opencode.jsonc"),
        join(configDir, "opencode.json"),
        join(root, "opencode.jsonc"),
        join(root, "opencode.json"),
    ];
    let configFile = candidates[0];
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
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
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
async function ensureContainedDirectory(path, parent, label) {
    await mkdir(path, { recursive: true });
    const [canonical, canonicalParent] = await Promise.all([realpath(path), realpath(parent)]);
    if (canonical !== resolve(path) || !isWithin(canonical, canonicalParent)) {
        throw new Error(`[opencode-manager] ${label} directory changed or escapes its managed parent`);
    }
    return canonical;
}
function emptyState() {
    return { version: 1, mcps: {}, skills: {}, rules: {}, agents: {} };
}
async function readState(context) {
    let source;
    try {
        source = await readFile(context.stateFile, "utf8");
    }
    catch (error) {
        if (error.code === "ENOENT")
            return emptyState();
        throw error;
    }
    const value = JSON.parse(source);
    if (!isObject(value) || value.version !== 1 || !isObject(value.mcps) || !isObject(value.skills)) {
        throw new Error(`[opencode-manager] Invalid manager state in ${context.stateFile}`);
    }
    if (value.rules !== undefined && !isObject(value.rules)) {
        throw new Error(`[opencode-manager] Invalid manager rule state in ${context.stateFile}`);
    }
    if (value.agents !== undefined && !isObject(value.agents)) {
        throw new Error(`[opencode-manager] Invalid manager agent state in ${context.stateFile}`);
    }
    const rules = {};
    for (const [id, raw] of Object.entries((value.rules ?? {}))) {
        if (!ID_PATTERN.test(id) || !isObject(raw))
            throw new Error(`[opencode-manager] Invalid managed rule state "${id}"`);
        rules[id] = {
            title: typeof raw.title === "string" && raw.title.trim() ? raw.title : id,
            description: typeof raw.description === "string" && raw.description.trim()
                ? raw.description
                : `Managed rule ${id}`,
            tags: raw.tags === undefined ? [] : stringList(raw.tags, `managed rule "${id}" tags`),
            path: raw.path === undefined ? `rules/${id}.md` : safeRelativePath(raw.path, `managed rule "${id}" path`),
            digest: text(raw.digest, `managed rule "${id}" digest`),
            configFile: raw.configFile === undefined
                ? await inferLegacyRuleConfigFile(context, id)
                : safeRelativePath(raw.configFile, `managed rule "${id}" configFile`),
        };
    }
    const agents = {};
    for (const [id, raw] of Object.entries((value.agents ?? {}))) {
        if (!ID_PATTERN.test(id) || !isObject(raw))
            throw new Error(`[opencode-manager] Invalid managed agent state "${id}"`);
        const digest = text(raw.digest, `managed agent "${id}" digest`);
        let type;
        if (raw.type === "single" || raw.type === "team") {
            type = raw.type;
        }
        else {
            const [single, team] = await Promise.all([
                inspectFile(agentDestination(context, id, "single")),
                inspectTree(agentDestination(context, id, "team"), `Managed agent team "${id}"`),
            ]);
            const matches = [
                single.kind === "file" && single.digest === digest ? "single" : undefined,
                team.kind === "directory" && team.digest === digest ? "team" : undefined,
            ].filter((item) => item !== undefined);
            if (matches.length === 1)
                type = matches[0];
            else if (single.kind === "absent" && team.kind === "absent")
                type = "single";
            else
                throw new Error(`[opencode-manager] Cannot safely infer legacy managed agent "${id}" type from its digest`);
        }
        let members = Number.isInteger(raw.members) && raw.members > 0 ? raw.members : 1;
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
            description: typeof raw.description === "string" && raw.description.trim()
                ? raw.description
                : `Managed agent ${id}`,
            tags: raw.tags === undefined ? [] : stringList(raw.tags, `managed agent "${id}" tags`),
            path: raw.path === undefined
                ? `agents/${id}${type === "single" ? ".md" : ""}`
                : safeRelativePath(raw.path, `managed agent "${id}" path`),
            digest,
            members,
        };
    }
    return {
        version: 1,
        mcps: value.mcps,
        skills: value.skills,
        rules,
        agents,
    };
}
async function writeAtomic(file, source, mode) {
    await mkdir(dirname(file), { recursive: true });
    const temporary = `${file}.${process.pid}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporary, source, { encoding: "utf8", mode });
        if (mode !== undefined)
            await chmod(temporary, mode);
        await rename(temporary, file);
    }
    finally {
        await unlink(temporary).catch(() => undefined);
    }
}
async function writeState(context, value) {
    await writeAtomic(context.stateFile, `${JSON.stringify(value, null, 2)}\n`, 0o644);
}
async function reclaimStaleLock(file) {
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
            }
            catch (error) {
                if (error.code !== "ESRCH")
                    return false;
            }
        }
        else if (Date.now() - info.mtimeMs < LOCK_TIMEOUT_MS) {
            return false;
        }
        await unlink(file);
        return true;
    }
    catch (error) {
        if (error.code === "ENOENT")
            return true;
        throw error;
    }
}
async function withProjectLock(context, fn) {
    await mkdir(context.managerDir, { recursive: true });
    const canonicalManagerDir = await realpath(context.managerDir);
    if (canonicalManagerDir !== context.managerDir || !isWithin(canonicalManagerDir, context.configDir)) {
        throw new Error("[opencode-manager] Manager state directory changed or escapes .opencode");
    }
    try {
        const ignore = await open(join(context.managerDir, ".gitignore"), "wx", 0o644);
        try {
            await ignore.writeFile("backups/\ncache/\nmanager.lock\n*.tmp\n*.old\n");
        }
        finally {
            await ignore.close();
        }
    }
    catch (error) {
        if (error.code !== "EEXIST")
            throw error;
    }
    const started = Date.now();
    let handle;
    while (!handle) {
        try {
            handle = await open(context.lockFile, "wx", 0o600);
            await handle.writeFile(`${process.pid}\n${Date.now()}\n`);
        }
        catch (error) {
            if (error.code !== "EEXIST")
                throw error;
            if (await reclaimStaleLock(context.lockFile))
                continue;
            if (Date.now() - started >= LOCK_TIMEOUT_MS) {
                throw new Error(`[opencode-manager] Timed out waiting for project lock ${context.lockFile}`);
            }
            await Bun.sleep(50);
        }
    }
    try {
        return await fn();
    }
    finally {
        await handle.close();
        await unlink(context.lockFile).catch(() => undefined);
    }
}
async function readConfigFile(file) {
    try {
        const [source, info] = await Promise.all([readFile(file, "utf8"), stat(file)]);
        const normalized = source.trim() === "" ? EMPTY_PROJECT_CONFIG : source;
        return { file, source: normalized, value: parseJsonc(file, normalized), mode: info.mode & 0o777 };
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
        return { file, source: EMPTY_PROJECT_CONFIG, value: parseJsonc(file, EMPTY_PROJECT_CONFIG) };
    }
}
async function readProjectConfig(context) {
    return readConfigFile(context.configFile);
}
function statePath(root, file) {
    const path = relative(root, file).split(sep).join("/");
    if (path === "" || path === ".." || path.startsWith("../")) {
        throw new Error(`[opencode-manager] Managed state path escapes project root: ${file}`);
    }
    return path;
}
async function resolveRuleConfigFile(context, path, label) {
    const normalized = safeRelativePath(path, label);
    const file = resolve(context.root, normalized);
    if (!isWithin(file, context.root))
        throw new Error(`[opencode-manager] ${label} escapes project root`);
    const supported = new Set([
        join(context.configDir, "opencode.jsonc"),
        join(context.configDir, "opencode.json"),
        join(context.root, "opencode.jsonc"),
        join(context.root, "opencode.json"),
    ].map((candidate) => resolve(candidate)));
    if (!supported.has(file))
        throw new Error(`[opencode-manager] ${label} is not a supported OpenCode project config`);
    const parent = dirname(file);
    const canonicalParent = await realpath(parent);
    if (canonicalParent !== parent || !isWithin(canonicalParent, context.root)) {
        throw new Error(`[opencode-manager] ${label} parent changed or escapes project root`);
    }
    try {
        const info = await lstat(file);
        if (info.isSymbolicLink() || !info.isFile() || await realpath(file) !== file) {
            throw new Error(`[opencode-manager] ${label} changed or is not a regular project config`);
        }
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
    }
    return file;
}
async function inferLegacyRuleConfigFile(context, id) {
    const candidates = [
        join(context.configDir, "opencode.jsonc"),
        join(context.configDir, "opencode.json"),
        join(context.root, "opencode.jsonc"),
        join(context.root, "opencode.json"),
    ];
    const instruction = ruleInstruction(id);
    const matches = [];
    for (const candidate of candidates) {
        const path = statePath(context.root, candidate);
        const file = await resolveRuleConfigFile(context, path, `legacy rule "${id}" configFile`);
        const config = await readConfigFile(file);
        if (projectInstructions(config).includes(instruction))
            matches.push(path);
    }
    if (matches.length > 1) {
        throw new Error(`[opencode-manager] Legacy managed rule "${id}" instruction exists in multiple project configs`);
    }
    return matches[0] ?? statePath(context.root, context.configFile);
}
function stableJson(value) {
    if (Array.isArray(value))
        return `[${value.map(stableJson).join(",")}]`;
    if (isObject(value)) {
        return `{${Object.keys(value)
            .sort()
            .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`)
            .join(",")}}`;
    }
    return JSON.stringify(value);
}
function hash(value) {
    return createHash("sha256").update(value).digest("hex");
}
function mcpDefinition(value) {
    if (!isObject(value) || (value.type !== "local" && value.type !== "remote"))
        return undefined;
    return Object.fromEntries(Object.entries(value).filter(([key]) => key !== "enabled"));
}
function mcpHash(value) {
    const definition = mcpDefinition(value);
    return definition ? hash(stableJson(definition)) : undefined;
}
function rawMcpMap(config) {
    return isObject(config.value.mcp) ? config.value.mcp : {};
}
function effectiveMcp(options, id) {
    return options.effectiveMcp?.[id];
}
function catalogMcpHash(entry) {
    return mcpHash(entry.config);
}
function referencePattern(value) {
    const marker = /\{(?:env|file):[^}]+\}/g;
    if (!marker.test(value))
        return undefined;
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
function registryValueMatches(expected, actual) {
    if (typeof expected === "string" && typeof actual === "string") {
        return referencePattern(expected)?.test(actual) ?? expected === actual;
    }
    if (Array.isArray(expected)) {
        return Array.isArray(actual) &&
            expected.length === actual.length &&
            expected.every((item, index) => registryValueMatches(item, actual[index]));
    }
    if (isObject(expected)) {
        if (!isObject(actual))
            return false;
        const expectedKeys = Object.keys(expected).filter((key) => key !== "enabled").sort();
        const actualKeys = Object.keys(actual).filter((key) => key !== "enabled").sort();
        return expectedKeys.length === actualKeys.length &&
            expectedKeys.every((key, index) => key === actualKeys[index] && registryValueMatches(expected[key], actual[key]));
    }
    return Object.is(expected, actual);
}
function matchesMcpRegistry(entry, value) {
    return registryValueMatches(mcpDefinition(entry.config), mcpDefinition(value));
}
function classifyMcp(entry, raw, inherited, managed) {
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
    if (!candidate && raw !== undefined)
        return { enabled, status: "conflict", ownership };
    return { enabled, status: enabled ? "enabled" : raw === undefined && inherited === undefined ? "absent" : "disabled", ownership };
}
export async function listMcps(options) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    const [config, state] = await Promise.all([readProjectConfig(context), readState(context)]);
    const raw = rawMcpMap(config);
    return Object.entries(catalog.mcps).map(([id, entry]) => ({
        id,
        title: entry.title,
        description: entry.description,
        tags: entry.tags,
        type: entry.config.type,
        ...classifyMcp(entry, raw[id], effectiveMcp(options, id), state.mcps[id]),
    }));
}
async function backupMcp(context, id, value) {
    if (value === undefined)
        return;
    const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
    const directory = await ensureContainedDirectory(join(backupRoot, "mcps"), backupRoot, "MCP backup");
    const file = join(directory, `${id}-${Date.now()}-${randomUUID()}.json`);
    await writeAtomic(file, `${JSON.stringify(value, null, 2)}\n`, 0o600);
}
export async function setMcpEnabled(options, id, enabled, mutation = {}) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    const entry = catalog.mcps[id];
    if (!entry)
        throw new Error(`[opencode-manager] Unknown MCP "${id}"`);
    await withProjectLock(context, async () => {
        const [config, state] = await Promise.all([readProjectConfig(context), readState(context)]);
        const raw = rawMcpMap(config)[id];
        const inherited = effectiveMcp(options, id);
        const managed = state.mcps[id];
        const expectedHash = catalogMcpHash(entry);
        let replacement;
        let nextSource;
        if (managed) {
            if (!isObject(raw) || mcpHash(raw) !== managed.appliedHash) {
                if (!mutation.override) {
                    throw new Error(`[opencode-manager] MCP "${id}" was modified after manager installation`);
                }
                await backupMcp(context, id, raw);
            }
            replacement = { ...structuredClone(entry.config), enabled };
            nextSource = applyEdits(config.source, modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
            state.mcps[id] = { appliedHash: expectedHash };
        }
        else if (mcpDefinition(raw)) {
            if (!matchesMcpRegistry(entry, raw)) {
                if (!mutation.override) {
                    throw new Error(`[opencode-manager] MCP "${id}" conflicts with the registry definition`);
                }
                await backupMcp(context, id, raw);
                replacement = { ...structuredClone(entry.config), enabled };
                nextSource = applyEdits(config.source, modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
                state.mcps[id] = { appliedHash: expectedHash };
            }
            else {
                nextSource = applyEdits(config.source, modify(config.source, ["mcp", id, "enabled"], enabled, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
            }
        }
        else if (mcpDefinition(inherited)) {
            if (!matchesMcpRegistry(entry, inherited)) {
                if (!mutation.override) {
                    throw new Error(`[opencode-manager] Inherited MCP "${id}" conflicts with the registry definition`);
                }
                replacement = { ...structuredClone(entry.config), enabled };
                nextSource = applyEdits(config.source, modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
                state.mcps[id] = { appliedHash: expectedHash };
            }
            else {
                nextSource = applyEdits(config.source, modify(config.source, ["mcp", id, "enabled"], enabled, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
            }
        }
        else {
            if (raw !== undefined) {
                if (!mutation.override) {
                    throw new Error(`[opencode-manager] MCP "${id}" has an override without a matching effective definition`);
                }
                await backupMcp(context, id, raw);
            }
            replacement = { ...structuredClone(entry.config), enabled };
            nextSource = applyEdits(config.source, modify(config.source, ["mcp", id], replacement, { formattingOptions: { insertSpaces: true, tabSize: 2 } }));
            state.mcps[id] = { appliedHash: expectedHash };
        }
        if (nextSource !== config.source)
            await writeAtomic(context.configFile, nextSource, config.mode);
        await writeState(context, state);
    });
    const updated = (await listMcps(options)).find((item) => item.id === id);
    if (!updated)
        throw new Error(`[opencode-manager] MCP "${id}" disappeared from the registry`);
    return updated;
}
function runGit(args, cwd, timeoutMs = 90_000) {
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
        const stdout = [];
        const stderr = [];
        child.stdout.on("data", (chunk) => stdout.push(chunk));
        child.stderr.on("data", (chunk) => stderr.push(chunk));
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
async function ensureGitSource(context, id, source) {
    const cacheDir = await ensureContainedDirectory(context.cacheDir, context.managerDir, "vendor cache");
    const target = join(cacheDir, id);
    if (!isWithin(target, context.managerDir))
        throw new Error(`[opencode-manager] Invalid cache path for "${id}"`);
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
        if (head === source.revision && status === "" && origin === source.repository)
            return target;
    }
    catch (error) {
        if (error.message?.includes("Invalid cache directory"))
            throw error;
        // Replace an absent or stale manager-owned cache below.
    }
    const temporary = `${target}.${process.pid}.${randomUUID()}.tmp`;
    const previous = `${target}.${process.pid}.${randomUUID()}.old`;
    try {
        await runGit(["clone", "--filter=blob:none", "--no-checkout", "--no-recurse-submodules", source.repository, temporary]);
        await runGit(["-C", temporary, "fetch", "--depth", "1", "origin", source.revision]);
        await runGit(["-C", temporary, "checkout", "--detach", "FETCH_HEAD"]);
        const head = await runGit(["-C", temporary, "rev-parse", "HEAD"]);
        if (head !== source.revision)
            throw new Error(`[opencode-manager] Source "${id}" resolved to unexpected commit ${head}`);
        try {
            await lstat(join(temporary, ".gitmodules"));
            throw new Error(`[opencode-manager] Source "${id}" contains submodules, which are not supported`);
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
        let movedPrevious = false;
        try {
            await rename(target, previous);
            movedPrevious = true;
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
        try {
            await rename(temporary, target);
        }
        catch (error) {
            if (movedPrevious)
                await rename(previous, target).catch(() => undefined);
            throw error;
        }
        if (movedPrevious)
            await rm(previous, { recursive: true, force: true });
        return target;
    }
    finally {
        await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
        await rm(previous, { recursive: true, force: true }).catch(() => undefined);
    }
}
async function skillSourceRoot(catalog, context, id) {
    const source = catalog.skillSources[id];
    if (!source)
        throw new Error(`[opencode-manager] Unknown skill source "${id}"`);
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
async function collectTree(root, label = "Skill tree") {
    const entries = [];
    let bytes = 0;
    async function visit(directory, prefix) {
        const names = (await readdir(directory)).sort();
        for (const name of names) {
            const absolute = join(directory, name);
            const path = prefix ? `${prefix}/${name}` : name;
            const info = await lstat(absolute);
            if (info.isSymbolicLink())
                throw new Error(`[opencode-manager] ${label} contains symlink "${path}"`);
            if (info.isDirectory()) {
                entries.push({ path: `${path}/`, mode: info.mode & 0o777 });
                if (entries.length > MAX_TREE_FILES)
                    throw new Error(`[opencode-manager] ${label} has too many entries`);
                await visit(absolute, path);
                continue;
            }
            if (!info.isFile())
                throw new Error(`[opencode-manager] ${label} contains unsupported entry "${path}"`);
            if (info.size > MAX_FILE_BYTES)
                throw new Error(`[opencode-manager] ${label} file "${path}" is too large`);
            bytes += info.size;
            if (bytes > MAX_TREE_BYTES)
                throw new Error(`[opencode-manager] ${label} is too large`);
            const content = await readFile(absolute);
            entries.push({ path, mode: info.mode & 0o777, content });
            if (entries.length > MAX_TREE_FILES)
                throw new Error(`[opencode-manager] ${label} has too many entries`);
        }
    }
    await visit(root, "");
    return entries;
}
function digestEntries(entries) {
    const digest = createHash("sha256");
    for (const entry of entries) {
        digest.update(entry.path);
        digest.update("\0");
        digest.update(entry.mode.toString(8));
        digest.update("\0");
        if (entry.content)
            digest.update(entry.content);
        digest.update("\0");
    }
    return digest.digest("hex");
}
async function inspectTree(path, label = "Skill tree") {
    try {
        const info = await lstat(path);
        if (info.isSymbolicLink() || !info.isDirectory())
            return { kind: "unsupported" };
    }
    catch (error) {
        if (error.code === "ENOENT")
            return { kind: "absent" };
        throw error;
    }
    return { kind: "directory", digest: digestEntries(await collectTree(path, label)) };
}
async function inspectFile(path) {
    try {
        const info = await lstat(path);
        if (info.isSymbolicLink() || !info.isFile())
            return { kind: "unsupported" };
        if (info.size > MAX_FILE_BYTES)
            throw new Error(`[opencode-manager] Managed file "${path}" is too large`);
    }
    catch (error) {
        if (error.code === "ENOENT")
            return { kind: "absent" };
        throw error;
    }
    return { kind: "file", digest: hash(await readFile(path)) };
}
function parseMarkdownFrontmatter(file, source) {
    const lines = source.split(/\r?\n/);
    if (lines[0]?.trim() !== "---")
        throw new Error(`[opencode-manager] Agent ${file} has no YAML frontmatter`);
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (end < 0)
        throw new Error(`[opencode-manager] Agent ${file} has unterminated YAML frontmatter`);
    const data = parseYaml(lines.slice(1, end).join("\n"));
    if (!isObject(data))
        throw new Error(`[opencode-manager] Agent ${file} frontmatter must be an object`);
    return { data, content: lines.slice(end + 1).join("\n").trim() };
}
function validateAgentDocument(file, source, expectedName) {
    const { data, content } = parseMarkdownFrontmatter(file, source);
    text(data.description, `agent ${file} description`);
    if (data.name !== undefined && data.name !== expectedName) {
        throw new Error(`[opencode-manager] Agent ${file} name must match "${expectedName}"`);
    }
    if (data.mode !== undefined && !["subagent", "primary", "all"].includes(String(data.mode))) {
        throw new Error(`[opencode-manager] Agent ${file} has invalid mode`);
    }
    for (const field of ["model", "variant", "prompt"]) {
        if (data[field] !== undefined && typeof data[field] !== "string") {
            throw new Error(`[opencode-manager] Agent ${file} ${field} must be a string`);
        }
    }
    for (const field of ["temperature", "top_p"]) {
        if (data[field] !== undefined && (typeof data[field] !== "number" || !Number.isFinite(data[field]))) {
            throw new Error(`[opencode-manager] Agent ${file} ${field} must be a finite number`);
        }
    }
    for (const field of ["steps", "maxSteps"]) {
        if (data[field] !== undefined && (!Number.isInteger(data[field]) || data[field] <= 0)) {
            throw new Error(`[opencode-manager] Agent ${file} ${field} must be a positive integer`);
        }
    }
    for (const field of ["disable", "hidden"]) {
        if (data[field] !== undefined && typeof data[field] !== "boolean") {
            throw new Error(`[opencode-manager] Agent ${file} ${field} must be boolean`);
        }
    }
    if (data.color !== undefined && (typeof data.color !== "string" ||
        !/^#[0-9a-fA-F]{6}$/.test(data.color) &&
            !["primary", "secondary", "accent", "success", "warning", "error", "info"].includes(data.color))) {
        throw new Error(`[opencode-manager] Agent ${file} has invalid color`);
    }
    if (data.tools !== undefined && (!isObject(data.tools) || Object.values(data.tools).some((value) => typeof value !== "boolean"))) {
        throw new Error(`[opencode-manager] Agent ${file} tools must contain boolean values`);
    }
    if (data.options !== undefined && !isObject(data.options)) {
        throw new Error(`[opencode-manager] Agent ${file} options must be an object`);
    }
    if (data.permission !== undefined)
        validateAgentPermissions(file, data.permission);
    if (content === "")
        throw new Error(`[opencode-manager] Agent ${file} prompt must not be empty`);
}
function validateAgentPermissions(file, value) {
    const decisions = new Set(["allow", "ask", "deny"]);
    if (typeof value === "string" && decisions.has(value))
        return;
    if (!isObject(value))
        throw new Error(`[opencode-manager] Agent ${file} permission must be an action or object`);
    const actionOnly = new Set(["todowrite", "question", "webfetch", "websearch", "doom_loop"]);
    for (const [tool, permission] of Object.entries(value)) {
        if (typeof permission === "string" && decisions.has(permission))
            continue;
        if (!actionOnly.has(tool) &&
            isObject(permission) &&
            Object.values(permission).every((decision) => typeof decision === "string" && decisions.has(decision))) {
            continue;
        }
        throw new Error(`[opencode-manager] Agent ${file} permission for "${tool}" is invalid`);
    }
}
async function registryFile(catalog, entry, label) {
    const catalogRoot = await realpath(catalog.root);
    const requested = resolve(catalogRoot, entry.path);
    if (!isWithin(requested, catalogRoot))
        throw new Error(`[opencode-manager] ${label} source escapes the registry root`);
    const info = await lstat(requested);
    if (info.isSymbolicLink() || !info.isFile())
        throw new Error(`[opencode-manager] ${label} source must be a regular file`);
    const file = await realpath(requested);
    if (!isWithin(file, catalogRoot))
        throw new Error(`[opencode-manager] ${label} source escapes the registry root`);
    if (info.size > MAX_FILE_BYTES)
        throw new Error(`[opencode-manager] ${label} source is too large`);
    const content = await readFile(file);
    if (content.toString("utf8").trim() === "")
        throw new Error(`[opencode-manager] ${label} source must not be empty`);
    return content;
}
async function agentBundle(catalog, id, entry) {
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
    if (files.length < 2)
        throw new Error(`[opencode-manager] Agent team "${id}" must contain at least two agents`);
    for (const item of files) {
        if (!item.path.endsWith(".md")) {
            throw new Error(`[opencode-manager] Agent team "${id}" contains non-agent file "${item.path}"`);
        }
        const member = item.path.slice(0, -3);
        const expectedName = `${id}/${member}`;
        if (!AGENT_PATH_PATTERN.test(expectedName)) {
            throw new Error(`[opencode-manager] Agent team "${id}" has invalid member path "${item.path}"`);
        }
        validateAgentDocument(item.path, item.content.toString("utf8"), expectedName);
    }
    return { entries, digest: digestEntries(entries), members: files.length };
}
async function copyEntries(entries, destination) {
    await mkdir(destination, { recursive: true });
    for (const entry of entries) {
        const target = join(destination, entry.path);
        if (!isWithin(target, destination))
            throw new Error(`[opencode-manager] Skill entry escapes destination: ${entry.path}`);
        if (entry.path.endsWith("/")) {
            await mkdir(target, { recursive: true, mode: entry.mode });
            await chmod(target, entry.mode);
        }
        else {
            await mkdir(dirname(target), { recursive: true });
            await writeFile(target, entry.content, { mode: entry.mode });
            await chmod(target, entry.mode);
        }
    }
}
async function ensureSkillsDirectory(context) {
    await mkdir(context.skillsDir, { recursive: true });
    const canonical = await realpath(context.skillsDir);
    if (canonical !== context.skillsDir || !isWithin(canonical, context.configDir)) {
        throw new Error("[opencode-manager] Project skills directory changed or escapes .opencode");
    }
}
function parseSkillFrontmatter(file, source) {
    const lines = source.split(/\r?\n/);
    if (lines[0]?.trim() !== "---")
        throw new Error(`[opencode-manager] Skill ${file} has no YAML frontmatter`);
    const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
    if (end < 0)
        throw new Error(`[opencode-manager] Skill ${file} has unterminated YAML frontmatter`);
    const value = parseYaml(lines.slice(1, end).join("\n"));
    if (!isObject(value))
        throw new Error(`[opencode-manager] Skill ${file} frontmatter must be an object`);
    const name = text(value.name, `skill ${file} name`);
    if (!SKILL_NAME_PATTERN.test(name) || name.length > 64) {
        throw new Error(`[opencode-manager] Skill ${file} has invalid name "${name}"`);
    }
    return { name, description: text(value.description, `skill ${file} description`) };
}
async function discoverSkillDirectories(root) {
    const found = [];
    let visited = 0;
    async function visit(directory) {
        for (const name of (await readdir(directory)).sort()) {
            const absolute = join(directory, name);
            const info = await lstat(absolute);
            if (info.isSymbolicLink())
                throw new Error(`[opencode-manager] Skill source contains symlink ${absolute}`);
            if (info.isFile() && name === "SKILL.md")
                found.push(dirname(absolute));
            if (info.isDirectory())
                await visit(absolute);
            visited += 1;
            if (visited > 20_000)
                throw new Error("[opencode-manager] Skill source has too many entries");
        }
    }
    await visit(root);
    return found;
}
export async function listSkillSources(options) {
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
export async function listSkills(options, sourceID) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    const source = catalog.skillSources[sourceID];
    if (!source)
        throw new Error(`[opencode-manager] Unknown skill source "${sourceID}"`);
    const root = await skillSourceRoot(catalog, context, sourceID);
    const discovered = await discoverSkillDirectories(root);
    const directorySet = new Set(discovered);
    const directories = discovered.filter((directory) => {
        let parent = dirname(directory);
        while (isWithin(parent, root) && parent !== root) {
            if (directorySet.has(parent))
                return false;
            parent = dirname(parent);
        }
        return true;
    });
    const state = await readState(context);
    const names = new Map();
    const manifests = await Promise.all(directories.map(async (directory) => {
        const path = relative(root, directory).split(sep).join("/") || ".";
        const manifest = parseSkillFrontmatter(join(directory, "SKILL.md"), await readFile(join(directory, "SKILL.md"), "utf8"));
        const duplicate = names.get(manifest.name);
        if (duplicate)
            throw new Error(`[opencode-manager] Skill source "${sourceID}" has duplicate name "${manifest.name}" at ${duplicate} and ${path}`);
        names.set(manifest.name, path);
        return { directory, path, ...manifest };
    }));
    const result = [];
    for (const manifest of manifests) {
        const id = `${sourceID}:${manifest.path}`;
        const managed = state.skills[id];
        const destination = join(context.skillsDir, manifest.name);
        if (!isWithin(destination, context.configDir))
            throw new Error(`[opencode-manager] Invalid skill destination for "${manifest.name}"`);
        const current = await inspectTree(destination);
        let status = "absent";
        if (current.kind === "unsupported")
            status = "conflict";
        if (current.kind === "directory" && !managed)
            status = "conflict";
        if (current.kind === "directory" && managed)
            status = current.digest === managed.digest ? "managed" : "modified";
        if (current.kind === "absent" && managed)
            status = "modified";
        const nestedSkills = discovered.filter((candidate) => candidate !== manifest.directory && isWithin(candidate, manifest.directory)).length;
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
async function skillArchivePath(context, name, reason) {
    const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
    const skillsRoot = await ensureContainedDirectory(join(backupRoot, "skills"), backupRoot, "skill backup");
    const directory = await ensureContainedDirectory(join(skillsRoot, reason), skillsRoot, `${reason} skill backup`);
    return join(directory, `${name}-${Date.now()}-${randomUUID()}`);
}
async function replaceSkillTree(entries, destination, preservedPrevious) {
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
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
        try {
            await rename(temporary, destination);
        }
        catch (error) {
            if (movedPrevious)
                await rename(previousTarget, destination).catch(() => undefined);
            throw error;
        }
        if (movedPrevious && !preservedPrevious)
            await rm(previous, { recursive: true, force: true });
    }
    finally {
        await rm(temporary, { recursive: true, force: true }).catch(() => undefined);
        await rm(previous, { recursive: true, force: true }).catch(() => undefined);
    }
}
async function replaceManagedFile(content, destination, preservedPrevious) {
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
        }
        catch (error) {
            if (error.code !== "ENOENT")
                throw error;
        }
        try {
            await rename(temporary, destination);
        }
        catch (error) {
            if (movedPrevious)
                await rename(previousTarget, destination).catch(() => undefined);
            throw error;
        }
        if (movedPrevious && !preservedPrevious)
            await rm(previous, { force: true });
    }
    finally {
        await rm(temporary, { force: true }).catch(() => undefined);
        await rm(previous, { force: true }).catch(() => undefined);
    }
}
async function managedArchivePath(context, kind, id, reason, directory) {
    const backupRoot = await ensureContainedDirectory(context.backupDir, context.managerDir, "backup");
    const resourceRoot = await ensureContainedDirectory(join(backupRoot, kind), backupRoot, `${kind} backup`);
    const reasonRoot = await ensureContainedDirectory(join(resourceRoot, reason), resourceRoot, `${reason} ${kind} backup`);
    return join(reasonRoot, `${id}-${Date.now()}-${randomUUID()}${directory ? "" : ".md"}`);
}
async function ensureProjectResourceDirectory(context, directory, label) {
    await mkdir(directory, { recursive: true });
    const canonical = await realpath(directory);
    if (canonical !== directory || !isWithin(canonical, context.configDir)) {
        throw new Error(`[opencode-manager] Project ${label} directory changed or escapes .opencode`);
    }
}
export async function setSkillEnabled(options, sourceID, skillPath, enabled, mutation = {}) {
    const [catalog, context, available] = await Promise.all([
        loadCatalogInternal(options),
        projectContext(options.projectRoot),
        listSkills(options, sourceID),
    ]);
    const normalizedPath = safeRelativePath(skillPath, "skill path");
    const skill = available.find((item) => item.path === normalizedPath);
    if (!skill)
        throw new Error(`[opencode-manager] Unknown skill "${sourceID}:${normalizedPath}"`);
    const source = catalog.skillSources[sourceID];
    const root = await skillSourceRoot(catalog, context, sourceID);
    const sourceDirectory = resolve(root, normalizedPath);
    if (!isWithin(sourceDirectory, root))
        throw new Error(`[opencode-manager] Skill path escapes source root`);
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
            if (currentDigest !== digest || owner)
                await replaceSkillTree(entries, destination, preserve);
            if (owner)
                delete state.skills[owner[0]];
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
            if (!mutation.override)
                throw new Error(`[opencode-manager] Managed skill "${skill.name}" is missing`);
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
    if (!updated)
        throw new Error(`[opencode-manager] Skill "${id}" disappeared from its source`);
    return updated;
}
function ruleInstruction(id) {
    return `.opencode/instructions/${id}.md`;
}
function projectInstructions(config) {
    return config.value.instructions === undefined
        ? []
        : stringList(config.value.instructions, `project config "instructions"`);
}
function updateProjectInstruction(config, instruction, enabled) {
    const current = projectInstructions(config);
    const formattingOptions = { insertSpaces: true, tabSize: 2 };
    if (enabled) {
        if (current.includes(instruction))
            return config.source;
        const path = config.value.instructions === undefined ? ["instructions"] : ["instructions", -1];
        const value = config.value.instructions === undefined ? [instruction] : instruction;
        return applyEdits(config.source, modify(config.source, path, value, { formattingOptions }));
    }
    let source = config.source;
    for (let index = current.length - 1; index >= 0; index -= 1) {
        if (current[index] !== instruction)
            continue;
        source = applyEdits(source, modify(source, ["instructions", index], undefined, { formattingOptions }));
    }
    return source;
}
export async function listRules(options) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    const [selectedConfig, state] = await Promise.all([readProjectConfig(context), readState(context)]);
    const ids = [...new Set([...Object.keys(catalog.rules), ...Object.keys(state.rules)])];
    return Promise.all(ids.map(async (id) => {
        const registryEntry = own(catalog.rules, id);
        const managed = own(state.rules, id);
        const entry = registryEntry ?? managed;
        if (!entry)
            throw new Error(`[opencode-manager] Rule "${id}" has no registry or state metadata`);
        let sourceValid = true;
        if (registryEntry) {
            try {
                await registryFile(catalog, registryEntry, `Rule "${id}"`);
            }
            catch (error) {
                if (!managed)
                    throw error;
                sourceValid = false;
            }
        }
        const config = managed?.configFile
            ? await readConfigFile(await resolveRuleConfigFile(context, managed.configFile, `rule "${id}" configFile`))
            : selectedConfig;
        const instructions = projectInstructions(config);
        const destination = join(context.instructionsDir, `${id}.md`);
        const current = await inspectFile(destination);
        let status;
        if (managed) {
            status = sourceValid && current.kind === "file" && current.digest === managed.digest && instructions.includes(ruleInstruction(id))
                ? "managed"
                : "modified";
        }
        else {
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
    }));
}
export async function setRuleEnabled(options, id, enabled, mutation = {}) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    const destination = join(context.instructionsDir, `${id}.md`);
    const instruction = ruleInstruction(id);
    let resultEntry;
    await withProjectLock(context, async () => {
        const state = await readState(context);
        const registryEntry = own(catalog.rules, id);
        const managed = own(state.rules, id);
        const entry = registryEntry ?? managed;
        if (!entry)
            throw new Error(`[opencode-manager] Unknown rule "${id}"`);
        resultEntry = entry;
        const config = managed?.configFile
            ? await readConfigFile(await resolveRuleConfigFile(context, managed.configFile, `rule "${id}" configFile`))
            : await readProjectConfig(context);
        const current = await inspectFile(destination);
        const instructionPresent = projectInstructions(config).includes(instruction);
        if (enabled) {
            if (!registryEntry)
                throw new Error(`[opencode-manager] Rule "${id}" is no longer available in the registry`);
            const content = await registryFile(catalog, registryEntry, `Rule "${id}"`);
            const digest = hash(content);
            if (current.kind === "unsupported") {
                throw new Error(`[opencode-manager] Rule destination "${id}" is a directory or symlink`);
            }
            const conflict = (current.kind === "file" && !managed) ||
                (managed && (current.kind !== "file" || current.digest !== managed.digest || !instructionPresent));
            if (conflict && !mutation.override) {
                const reason = managed ? "was modified after manager installation" : "already exists and is unmanaged";
                throw new Error(`[opencode-manager] Rule "${id}" ${reason}; confirm override to preserve and replace it`);
            }
            await ensureProjectResourceDirectory(context, context.instructionsDir, "instructions");
            const preserve = conflict && current.kind === "file"
                ? await managedArchivePath(context, "rules", id, "override", false)
                : undefined;
            if (conflict || current.kind !== "file" || current.digest !== digest) {
                await replaceManagedFile(content, destination, preserve);
            }
            const nextSource = updateProjectInstruction(config, instruction, true);
            if (nextSource !== config.source)
                await writeAtomic(config.file, nextSource, config.mode);
            state.rules[id] = {
                ...registryEntry,
                digest,
                configFile: statePath(context.root, config.file),
            };
            await writeState(context, state);
            return;
        }
        if (!managed) {
            if (current.kind !== "absent")
                throw new Error(`[opencode-manager] Refusing to disable unmanaged rule "${id}"`);
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
            throw new Error(`[opencode-manager] Refusing to disable rule "${id}" after its instruction reference was modified`);
        }
        if (current.kind === "file") {
            const archive = await managedArchivePath(context, "rules", id, "disabled", false);
            await rename(destination, archive);
        }
        const nextSource = updateProjectInstruction(config, instruction, false);
        if (nextSource !== config.source)
            await writeAtomic(config.file, nextSource, config.mode);
        delete state.rules[id];
        await writeState(context, state);
    });
    if (!enabled && resultEntry)
        return { id, ...resultEntry, status: "absent", ownership: "absent" };
    const updated = (await listRules(options)).find((item) => item.id === id);
    if (!updated)
        throw new Error(`[opencode-manager] Rule "${id}" disappeared from the registry`);
    return updated;
}
function inheritedAgent(options, id, type) {
    if (type === "single")
        return options.effectiveAgent?.[id] !== undefined;
    return Object.keys(options.effectiveAgent ?? {}).some((name) => name.startsWith(`${id}/`));
}
function agentDestination(context, id, type) {
    return join(context.agentsDir, type === "single" ? `${id}.md` : id);
}
export async function listAgents(options) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    const state = await readState(context);
    const ids = [...new Set([...Object.keys(catalog.agents), ...Object.keys(state.agents)])];
    return Promise.all(ids.map(async (id) => {
        const registryEntry = own(catalog.agents, id);
        const managed = own(state.agents, id);
        const entry = registryEntry ?? managed;
        if (!entry)
            throw new Error(`[opencode-manager] Agent resource "${id}" has no registry or state metadata`);
        let bundle;
        let sourceValid = true;
        if (registryEntry) {
            try {
                bundle = await agentBundle(catalog, id, registryEntry);
            }
            catch (error) {
                if (!managed)
                    throw error;
                sourceValid = false;
            }
        }
        const installedType = managed?.type ?? entry.type;
        const destination = agentDestination(context, id, installedType);
        const current = installedType === "single"
            ? await inspectFile(destination)
            : await inspectTree(destination, `Agent team "${id}"`);
        const currentDigest = current.kind === "file" || current.kind === "directory" ? current.digest : undefined;
        const inherited = !managed && current.kind === "absent" && inheritedAgent(options, id, entry.type);
        const status = managed
            ? sourceValid && managed.type === entry.type && currentDigest === managed.digest ? "managed" : "modified"
            : current.kind !== "absent" || inherited ? "conflict" : "absent";
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
    }));
}
export async function setAgentEnabled(options, id, enabled, mutation = {}) {
    const [catalog, context] = await Promise.all([loadCatalogInternal(options), projectContext(options.projectRoot)]);
    let resultEntry;
    let resultMembers = 1;
    await withProjectLock(context, async () => {
        const state = await readState(context);
        const registryEntry = own(catalog.agents, id);
        const managed = own(state.agents, id);
        const entry = registryEntry ?? managed;
        if (!entry)
            throw new Error(`[opencode-manager] Unknown agent or team "${id}"`);
        resultEntry = entry;
        resultMembers = managed?.members ?? 1;
        const installedType = managed?.type ?? entry.type;
        const installedDestination = agentDestination(context, id, installedType);
        const current = installedType === "single"
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
            const conflict = typeChanged || inherited || (target.kind !== "absent" && !managed) ||
                (managed && currentDigest !== managed.digest) || (typeChanged && target.kind !== "absent");
            if (conflict && !mutation.override) {
                const reason = inherited
                    ? "conflicts with an inherited same-name agent"
                    : typeChanged
                        ? `changed registry type from ${installedType} to ${registryEntry.type}`
                        : managed
                            ? "was modified after manager installation"
                            : "already exists and is unmanaged";
                throw new Error(`[opencode-manager] Agent resource "${id}" ${reason}; confirm override to preserve and replace it`);
            }
            await ensureProjectResourceDirectory(context, context.agentsDir, "agents");
            const preserve = (typeChanged ? target : current).kind !== "absent" && conflict
                ? await managedArchivePath(context, "agents", id, "override", registryEntry.type === "team")
                : undefined;
            let migratedArchive;
            if (typeChanged && current.kind !== "absent") {
                migratedArchive = await managedArchivePath(context, "agents", id, "override", installedType === "team");
                await rename(installedDestination, migratedArchive);
            }
            try {
                if (targetDigest !== bundle.digest || (conflict && target.kind !== "absent") || typeChanged) {
                    if (registryEntry.type === "single")
                        await replaceManagedFile(bundle.content, destination, preserve);
                    else
                        await replaceSkillTree(bundle.entries, destination, preserve);
                }
            }
            catch (error) {
                if (migratedArchive)
                    await rename(migratedArchive, installedDestination).catch(() => undefined);
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
    if (!updated)
        throw new Error(`[opencode-manager] Agent resource "${id}" disappeared from the registry`);
    return updated;
}
function profileState(profile, mcps, rules, agents, skills) {
    const mcpItems = profile.mcps.map((id) => mcps.find((item) => item.id === id));
    const ruleItems = profile.rules.map((id) => rules.find((item) => item.id === id));
    const agentItems = profile.agents.map((id) => agents.find((item) => item.id === id));
    const skillItems = profile.skills.map((item) => skills.get(`${item.source}:${item.path}`) ?? "absent");
    if (mcpItems.some((item) => item.status === "conflict") ||
        skillItems.some((status) => status === "modified") ||
        ruleItems.some((item) => item.status === "conflict" || item.status === "modified") ||
        agentItems.some((item) => item.status === "conflict" || item.status === "modified")) {
        return "conflict";
    }
    const enabledCount = mcpItems.filter((item) => item.enabled).length +
        skillItems.filter((status) => status === "managed").length +
        ruleItems.filter((item) => item.status === "managed").length +
        agentItems.filter((item) => item.status === "managed").length;
    const total = mcpItems.length + skillItems.length + profile.rules.length + profile.agents.length;
    if (enabledCount === 0)
        return "disabled";
    if (enabledCount === total)
        return "enabled";
    return "partial";
}
async function profileSkillStates(catalog, context, state) {
    const ids = [...new Set(catalog.profiles.flatMap((profile) => profile.skills.map((item) => `${item.source}:${item.path}`)))];
    const result = new Map();
    await Promise.all(ids.map(async (id) => {
        const managed = own(state.skills, id);
        if (!managed) {
            result.set(id, "absent");
            return;
        }
        const destination = join(context.skillsDir, managed.name);
        const current = await inspectTree(destination);
        result.set(id, current.kind === "directory" && current.digest === managed.digest ? "managed" : "modified");
    }));
    return result;
}
export async function listProfiles(options) {
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
        const enabledResources = profile.mcps.filter((id) => mcps.find((item) => item.id === id)?.enabled).length +
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
export async function getProfile(options, profileID) {
    const [catalog, profiles, mcps, rules, agents] = await Promise.all([
        loadCatalogInternal(options),
        listProfiles(options),
        listMcps(options),
        listRules(options),
        listAgents(options),
    ]);
    const profile = profiles.find((item) => item.id === profileID);
    if (!profile)
        throw new Error(`[opencode-manager] Unknown profile "${profileID}"`);
    const refs = catalog.profiles.find((item) => item.id === profileID).skills;
    const sourceIDs = [...new Set(refs.map((item) => item.source))];
    const sourceSkills = new Map();
    await Promise.all(sourceIDs.map(async (sourceID) => sourceSkills.set(sourceID, await listSkills(options, sourceID))));
    const skills = refs.map((ref) => {
        const skill = sourceSkills.get(ref.source)?.find((item) => item.path === ref.path);
        if (!skill)
            throw new Error(`[opencode-manager] Profile "${profileID}" references missing skill "${ref.source}:${ref.path}"`);
        return skill;
    });
    const hasConflict = mcps.some((item) => profile.mcps.includes(item.id) && item.status === "conflict") ||
        skills.some((item) => item.status === "conflict" || item.status === "modified") ||
        rules.some((item) => profile.rules.includes(item.id) && ["conflict", "modified"].includes(item.status)) ||
        agents.some((item) => profile.agents.includes(item.id) && ["conflict", "modified"].includes(item.status));
    return {
        profile: hasConflict ? { ...profile, status: "conflict" } : profile,
        mcps: profile.mcps.map((id) => mcps.find((item) => item.id === id)),
        skills,
        rules: profile.rules.map((id) => rules.find((item) => item.id === id)),
        agents: profile.agents.map((id) => agents.find((item) => item.id === id)),
    };
}
export async function setProfileEnabled(options, profileID, enabled, mutation = {}) {
    const detail = await getProfile(options, profileID);
    const mcpConflict = detail.mcps.find((item) => enabled ? item.status === "conflict" : item.status === "conflict" && item.ownership === "manager");
    if (mcpConflict && !mutation.override) {
        throw new Error(`[opencode-manager] Profile "${profileID}" has conflicting MCP "${mcpConflict.id}"; confirm override to continue`);
    }
    const skillConflict = detail.skills.find((item) => enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified");
    if (skillConflict && !mutation.override) {
        throw new Error(`[opencode-manager] Profile "${profileID}" has conflicting skill "${skillConflict.name}"; confirm override to continue`);
    }
    const ruleConflict = detail.rules.find((item) => enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified");
    if (ruleConflict && !mutation.override) {
        throw new Error(`[opencode-manager] Profile "${profileID}" has conflicting rule "${ruleConflict.id}"; confirm override to continue`);
    }
    const agentConflict = detail.agents.find((item) => enabled ? item.status === "conflict" || item.status === "modified" : item.status === "modified");
    if (agentConflict && !mutation.override) {
        throw new Error(`[opencode-manager] Profile "${profileID}" has conflicting agent resource "${agentConflict.id}"; confirm override to continue`);
    }
    let applied = 0;
    try {
        for (const mcp of detail.mcps) {
            if (!enabled && mcp.status === "absent")
                continue;
            if (!enabled && mcp.status === "conflict" && mcp.ownership !== "manager")
                continue;
            await setMcpEnabled(options, mcp.id, enabled, mutation);
            applied += 1;
        }
        for (const skill of detail.skills) {
            if (!enabled && (skill.status === "absent" || skill.status === "conflict"))
                continue;
            await setSkillEnabled(options, skill.source, skill.path, enabled, mutation);
            applied += 1;
        }
        for (const rule of detail.rules) {
            if (!enabled && (rule.status === "absent" || rule.status === "conflict"))
                continue;
            await setRuleEnabled(options, rule.id, enabled, mutation);
            applied += 1;
        }
        for (const agent of detail.agents) {
            if (!enabled && (agent.status === "absent" || agent.status === "conflict"))
                continue;
            await setAgentEnabled(options, agent.id, enabled, mutation);
            applied += 1;
        }
    }
    catch (error) {
        if (applied === 0)
            throw error;
        const message = error instanceof Error ? error.message : String(error);
        throw Object.assign(new Error(`[opencode-manager] Profile "${profileID}" was partially applied: ${message}`), { partialApplied: true, cause: error });
    }
    return getProfile(options, profileID);
}
//# sourceMappingURL=manager.js.map