import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  TuiDialogSelectOption,
  TuiPlugin,
  TuiPluginApi,
  TuiPluginModule,
  TuiSidebarMcpItem,
} from "@opencode-ai/plugin/tui";
import type { JSX } from "@opentui/solid";
import type {
  AgentStatus,
  InstallerStatus,
  ManagerOptions,
  McpStatus,
  PluginStatus,
  ProfileStatus,
  RegistrySyncResult,
  RuleStatus,
  SkillSourceStatus,
  SkillStatus,
} from "./manager.js";

const DEFAULT_CATALOG = fileURLToPath(new URL("../registry/catalog.jsonc", import.meta.url));

type Parent = () => Promise<void>;

type Selection =
  | { type: "profile"; profile: ProfileStatus; parent: Parent }
  | { type: "mcp"; mcp: McpStatus; parent: Parent }
  | { type: "plugin"; plugin: PluginStatus; parent: Parent }
  | { type: "installer"; installer: InstallerStatus; parent: Parent }
  | { type: "skill-source"; source: SkillSourceStatus; skills: SkillStatus[]; parent: Parent }
  | { type: "skill"; skill: SkillStatus; parent: Parent }
  | { type: "rule"; rule: RuleStatus; parent: Parent }
  | { type: "agent"; agent: AgentStatus; parent: Parent };

type DialogValue =
  | { type: "back" }
  | { type: "mcps" }
  | { type: "plugins" }
  | { type: "installers" }
  | { type: "sync-registry" }
  | { type: "rules" }
  | { type: "agents" }
  | { type: "open-profile"; profile: ProfileStatus }
  | { type: "open-source"; source: SkillSourceStatus }
  | Selection;

function isSelection(value: DialogValue): value is Selection {
  return ["profile", "mcp", "plugin", "installer", "skill-source", "skill", "rule", "agent"].includes(value.type);
}

interface State {
  api: TuiPluginApi;
  projectRoot: string;
  catalogPath: string;
  syncEnabled: boolean;
  syncResult?: RegistrySyncResult;
  syncingRegistry: boolean;
  registrySyncPromise?: Promise<void>;
  updating: boolean;
  selection?: Selection;
  dialogToken?: symbol;
}

export function resolveProjectRoot(worktree: string, directory: string): string {
  return resolve(worktree && worktree !== "/" ? worktree : directory);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function options(state: State): ManagerOptions {
  const mcp = state.api.state.config?.mcp;
  const agent = state.api.state.config?.agent;
  const plugin = state.api.state.config?.plugin;
  return {
    projectRoot: state.projectRoot,
    catalogPath: state.catalogPath,
    effectiveMcp: mcp && typeof mcp === "object" && !Array.isArray(mcp) ? mcp : undefined,
    effectiveAgent: agent && typeof agent === "object" && !Array.isArray(agent) ? agent : undefined,
    effectivePlugin: Array.isArray(plugin) ? [...plugin] : undefined,
  };
}

async function manager() {
  return import("./manager.js");
}

function runtimeStatus(state: State, id: string): TuiSidebarMcpItem | undefined {
  return state.api.state.mcp().find((item) => item.name === id);
}

function profileFooter(profile: ProfileStatus): string {
  if (profile.status === "conflict") return `conflict · ${profile.enabledResources}/${profile.totalResources} selected`;
  return `${profile.status} · ${profile.enabledResources}/${profile.totalResources} selected`;
}

function mcpFooter(state: State, mcp: McpStatus): string {
  if (mcp.status === "conflict") return `conflict · ${mcp.ownership}`;
  const live = runtimeStatus(state, mcp.id);
  if (!mcp.enabled) return `${mcp.status} · ${mcp.ownership}`;
  if (!live) return `enabled · ${mcp.ownership} · runtime pending`;
  if (live.status === "failed" && live.error) return `enabled · failed: ${live.error}`;
  return `enabled · ${live.status.replaceAll("_", " ")} · ${mcp.ownership}`;
}

function pluginFooter(plugin: PluginStatus): string {
  return `${plugin.status} · ${plugin.ownership} · ${plugin.package}`;
}

function installerFooter(installer: InstallerStatus): string {
  return `${installer.status} · ${installer.ownership} · global · ${installer.revision.slice(0, 8)}`;
}

function registrySyncFooter(state: State): string {
  if (!state.syncEnabled) return "disabled for custom catalog";
  if (state.syncingRegistry) return "syncing";
  if (!state.syncResult) return "bundled catalog";
  const revision = state.syncResult.revision ? ` · ${state.syncResult.revision.slice(0, 8)}` : "";
  return `${state.syncResult.status}${revision}`;
}

function skillFooter(skill: SkillStatus): string {
  const nested = skill.nestedSkills ? ` · includes ${skill.nestedSkills} nested` : "";
  return `${skill.status}${nested}`;
}

function ruleFooter(rule: RuleStatus): string {
  return `${rule.status} · ${rule.ownership}`;
}

function agentFooter(agent: AgentStatus): string {
  const members = agent.type === "team" ? ` · ${agent.members} members` : "";
  return `${agent.status} · ${agent.ownership} · ${agent.type}${members}`;
}

function sourceFooter(source: SkillSourceStatus): string {
  const pin = source.revision ? ` · ${source.revision.slice(0, 8)}` : "";
  return `${source.installed} installed${pin}`;
}

function replaceDialog(
  state: State,
  selection: Selection | undefined,
  render: () => JSX.Element,
  onClose?: () => void,
): void {
  const token = Symbol("opencode-manager-dialog");
  state.dialogToken = token;
  state.selection = selection;
  state.api.ui.dialog.setSize("large");
  state.api.ui.dialog.replace(render, () => {
    if (state.dialogToken !== token) return;
    state.dialogToken = undefined;
    state.selection = undefined;
    onClose?.();
  });
}

function navigation(title: string): TuiDialogSelectOption<DialogValue> {
  return { title, value: { type: "back" }, category: "Navigation" };
}

async function showManager(state: State): Promise<void> {
  if (state.syncingRegistry && state.registrySyncPromise) await state.registrySyncPromise;
  try {
    const api = await manager();
    const [profiles, installers, sources] = await Promise.all([
      api.listProfiles(options(state)),
      api.listInstallers(options(state)),
      api.listSkillSources(options(state)),
    ]);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      ...profiles.map((profile) => ({
        title: profile.title,
        value: { type: "open-profile", profile } satisfies DialogValue,
        description: profile.description,
        footer: profileFooter(profile),
        category: "Profiles",
      })),
      {
        title: "MCP Registry",
        value: { type: "mcps" },
        description: "Browse and toggle individual project MCP definitions",
        category: "Registries",
      },
      {
        title: "Plugin Registry",
        value: { type: "plugins" },
        description: "Manage project-local OpenCode plugins",
        category: "Registries",
      },
      {
        title: "Installer Registry",
        value: { type: "installers" },
        description: "Install pinned external tool suites that require their own setup lifecycle",
        category: "Registries",
      },
      {
        title: "Rule Registry",
        value: { type: "rules" },
        description: "Install project instructions and keep project config references in sync",
        category: "Registries",
      },
      {
        title: "Sync Registry",
        value: { type: "sync-registry" },
        description: "Fetch the latest registry snapshot without reinstalling this plugin",
        footer: registrySyncFooter(state),
        category: "Actions",
      },
      ...installers.map((installer) => ({
        title: installer.title,
        value: { type: "installer", installer, parent: () => showManager(state) } satisfies DialogValue,
        description: installer.description,
        footer: installerFooter(installer),
        category: "External Installers",
      })),
      {
        title: "Agent Registry",
        value: { type: "agents" },
        description: "Install standalone agents or complete agent teams",
        category: "Registries",
      },
      ...sources.map((source) => ({
        title: source.title,
        value: { type: "open-source", source } satisfies DialogValue,
        description: source.repository ?? "Skills maintained in this repository",
        footer: sourceFooter(source),
        category: "Skill Registries",
      })),
    ];

    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: "Project Stack Manager",
        placeholder: "Search profiles, MCPs, plugins, rules, agents, or skills",
        options: rows,
        onMove() {
          state.selection = undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "open-profile") void showProfile(state, option.value.profile.id);
          if (option.value.type === "mcps") void showMcps(state);
          if (option.value.type === "plugins") void showPlugins(state);
          if (option.value.type === "installers") void showInstallers(state);
          if (option.value.type === "rules") void showRules(state);
          if (option.value.type === "agents") void showAgents(state);
          if (option.value.type === "open-source") void showSource(state, option.value.source.id);
          if (option.value.type === "sync-registry") void syncRemoteRegistry(state, true, false);
          if (option.value.type === "installer") confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  }
}

async function showProfile(state: State, profileID: string): Promise<void> {
  state.api.ui.toast({ variant: "info", message: "Loading pinned profile resources...", duration: 1500 });
  try {
    const api = await manager();
    const detail = await api.getProfile(options(state), profileID);
    const parent = () => showProfile(state, profileID);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      {
        title: "All profile resources",
        value: { type: "profile", profile: detail.profile, parent } satisfies DialogValue,
        description: "Apply this profile's MCPs and curated skills to the active project",
        footer: profileFooter(detail.profile),
        category: "Profile",
      },
      ...detail.mcps.map((mcp) => ({
        title: mcp.title,
        value: { type: "mcp", mcp, parent } satisfies DialogValue,
        description: mcp.description,
        footer: mcpFooter(state, mcp),
        category: "MCPs",
      })),
      ...detail.skills.map((skill) => ({
        title: skill.name,
        value: { type: "skill", skill, parent } satisfies DialogValue,
        description: `${skill.sourceTitle}: ${skill.description}`,
        footer: skillFooter(skill),
        category: "Skills",
      })),
      ...detail.rules.map((rule) => ({
        title: rule.title,
        value: { type: "rule", rule, parent } satisfies DialogValue,
        description: rule.description,
        footer: ruleFooter(rule),
        category: "Rules",
      })),
      ...detail.agents.map((agent) => ({
        title: agent.title,
        value: { type: "agent", agent, parent } satisfies DialogValue,
        description: agent.description,
        footer: agentFooter(agent),
        category: agent.type === "team" ? "Agent Teams" : "Agents",
      })),
    ];

    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: detail.profile.title,
        placeholder: "Enter/Space toggles · Ctrl+E enables · Ctrl+D disables",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
    await showManager(state);
  }
}

async function showMcps(state: State): Promise<void> {
  try {
    const api = await manager();
    const mcps = await api.listMcps(options(state));
    const parent = () => showMcps(state);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      ...mcps.map((mcp) => ({
        title: mcp.title,
        value: { type: "mcp", mcp, parent } satisfies DialogValue,
        description: `${mcp.description} [${mcp.id}]`,
        footer: mcpFooter(state, mcp),
        category: mcp.tags[0] ?? "MCPs",
      })),
    ];
    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: "MCP Registry",
        placeholder: "Search MCPs · Enter/Space toggles",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  }
}

async function showPlugins(state: State): Promise<void> {
  try {
    const api = await manager();
    const plugins = await api.listPlugins(options(state));
    const parent = () => showPlugins(state);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      ...plugins.map((plugin) => ({
        title: plugin.title,
        value: { type: "plugin", plugin, parent } satisfies DialogValue,
        description: `${plugin.description} [${plugin.id}]`,
        footer: pluginFooter(plugin),
        category: plugin.tags[0] ?? "Plugins",
      })),
    ];
    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: "Plugin Registry",
        placeholder: "Search OpenCode plugins · Enter/Space toggles",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  }
}

async function showInstallers(state: State): Promise<void> {
  try {
    const api = await manager();
    const installers = await api.listInstallers(options(state));
    const parent = () => showInstallers(state);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      ...installers.map((installer) => ({
        title: installer.title,
        value: { type: "installer", installer, parent } satisfies DialogValue,
        description: `${installer.description} [${installer.id}]`,
        footer: installerFooter(installer),
        category: installer.tags[0] ?? "Installers",
      })),
    ];
    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: "Installer Registry",
        placeholder: "Search external installers · Enter/Space installs or removes",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  }
}

async function showRules(state: State): Promise<void> {
  try {
    const api = await manager();
    const rules = await api.listRules(options(state));
    const parent = () => showRules(state);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      ...rules.map((rule) => ({
        title: rule.title,
        value: { type: "rule", rule, parent } satisfies DialogValue,
        description: `${rule.description} [${rule.id}]`,
        footer: ruleFooter(rule),
        category: rule.tags[0] ?? "Rules",
      })),
    ];
    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: "Rule Registry",
        placeholder: "Search project rules · Enter/Space toggles",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  }
}

async function showAgents(state: State): Promise<void> {
  try {
    const api = await manager();
    const agents = await api.listAgents(options(state));
    const parent = () => showAgents(state);
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      ...agents.map((agent) => ({
        title: agent.title,
        value: { type: "agent", agent, parent } satisfies DialogValue,
        description: `${agent.description} [${agent.id}]`,
        footer: agentFooter(agent),
        category: agent.type === "team" ? "Agent Teams" : (agent.tags[0] ?? "Agents"),
      })),
    ];
    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: "Agent Registry",
        placeholder: "Search standalone agents or teams · Enter/Space toggles",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  }
}

async function showSource(state: State, sourceID: string): Promise<void> {
  state.api.ui.toast({ variant: "info", message: "Loading pinned skill registry...", duration: 1500 });
  try {
    const api = await manager();
    const [sources, skills] = await Promise.all([
      api.listSkillSources(options(state)),
      api.listSkills(options(state), sourceID),
    ]);
    const source = sources.find((item) => item.id === sourceID);
    if (!source) throw new Error(`Unknown skill source ${sourceID}`);
    const parent = () => showSource(state, sourceID);
    const installed = skills.filter((skill) => skill.status === "managed" || skill.status === "modified").length;
    const rows: TuiDialogSelectOption<DialogValue>[] = [
      navigation("Back to manager"),
      ...(skills.length > 1
        ? [
            {
              title: `All skills (${skills.length})`,
              value: { type: "skill-source", source, skills, parent } satisfies DialogValue,
              description: "Install every skill from this source, or remove every manager-owned install",
              footer: `${installed}/${skills.length} installed`,
              category: "Bulk Actions",
            },
          ]
        : []),
      ...skills.map((skill) => ({
        title: skill.name,
        value: { type: "skill", skill, parent } satisfies DialogValue,
        description: skill.description,
        footer: skillFooter(skill),
        category: skill.path.includes("/") ? skill.path.split("/")[0] : "Skills",
      })),
    ];
    if (skills.length === 0) {
      state.api.ui.toast({ variant: "warning", message: `${source.title} has no skills yet.` });
    }
    replaceDialog(state, undefined, () =>
      state.api.ui.DialogSelect<DialogValue>({
        title: source.title,
        placeholder: "Search skills · Enter/Space toggles",
        options: rows,
        onMove(option) {
          state.selection = isSelection(option.value) ? option.value : undefined;
        },
        onFilter() {
          state.selection = undefined;
        },
        onSelect(option) {
          if (option.value.type === "back") void showManager(state);
          else if (isSelection(option.value)) confirmToggle(state, option.value);
        },
      }),
    );
  } catch (error) {
    state.api.ui.toast({ variant: "error", message: errorMessage(error) });
    await showManager(state);
  }
}

function selectionEnabled(selection: Selection): boolean {
  if (selection.type === "profile") return selection.profile.status === "enabled";
  if (selection.type === "mcp") return selection.mcp.enabled;
  if (selection.type === "plugin") return selection.plugin.enabled;
  if (selection.type === "installer") return selection.installer.status === "managed";
  if (selection.type === "skill-source") {
    return (
      selection.skills.length > 0 &&
      selection.skills.every((skill) => skill.status === "managed" || skill.status === "modified")
    );
  }
  if (selection.type === "skill") return selection.skill.status === "managed" || selection.skill.status === "modified";
  if (selection.type === "rule") return selection.rule.status === "managed" || selection.rule.status === "modified";
  if (selection.type === "agent") return selection.agent.status === "managed" || selection.agent.status === "modified";
  return false;
}

function selectionLabel(selection: Selection): string {
  if (selection.type === "profile") return selection.profile.title;
  if (selection.type === "mcp") return selection.mcp.title;
  if (selection.type === "plugin") return selection.plugin.title;
  if (selection.type === "installer") return selection.installer.title;
  if (selection.type === "skill-source") return `all ${selection.source.title} skills`;
  if (selection.type === "skill") return selection.skill.name;
  if (selection.type === "rule") return selection.rule.title;
  if (selection.type === "agent") return selection.agent.title;
  return "resource";
}

function activeSessionBusy(api: TuiPluginApi): boolean {
  const current = api.route.current;
  if (current.name !== "session" || !current.params) return false;
  const sessionID = current.params.sessionID;
  if (typeof sessionID !== "string") return false;
  const status = api.state.session.status(sessionID);
  return status?.type === "busy" || status?.type === "retry";
}

function selectionConflict(selection: Selection, enabled: boolean): boolean {
  if (selection.type === "profile") return selection.profile.status === "conflict";
  if (selection.type === "mcp") return selection.mcp.status === "conflict";
  if (selection.type === "plugin") return selection.plugin.status === "conflict";
  if (selection.type === "installer") return false;
  if (selection.type === "skill-source") {
    return selection.skills.some((skill) =>
      enabled ? skill.status === "conflict" || skill.status === "modified" : skill.status === "modified",
    );
  }
  if (selection.type === "skill") return selection.skill.status === "conflict" || selection.skill.status === "modified";
  if (selection.type === "rule") return selection.rule.status === "conflict" || selection.rule.status === "modified";
  return selection.agent.status === "conflict" || selection.agent.status === "modified";
}

function confirmToggle(state: State, selection: Selection, forcedEnabled?: boolean): void {
  if (selection.type === "installer" && selection.installer.status === "conflict") {
    state.api.ui.toast({
      variant: "error",
      message: `${selection.installer.title} has an external installation; manager will not replace or remove it.`,
    });
    return;
  }
  const enabled = forcedEnabled ?? !selectionEnabled(selection);
  const label = selectionLabel(selection);
  const scope =
    selection.type === "profile"
      ? "Every registry resource in this profile"
      : selection.type === "installer"
        ? "This global OpenCode tool suite"
        : selection.type === "skill-source"
          ? `Every skill in this source (${selection.skills.length})`
          : "This resource";
  const hasConflict = selectionConflict(selection, enabled);
  const conflict =
    selection.type === "mcp" && selection.mcp.status === "conflict"
      ? "\n\nThis MCP conflicts with an existing definition and the operation will be refused."
      : selection.type === "plugin" && selection.plugin.status === "conflict"
        ? "\n\nThis plugin has a different version or options; an approved replacement or removal is backed up first."
        : selection.type === "plugin" && selection.plugin.ownership === "inherited" && !enabled
          ? "\n\nInherited plugins cannot be disabled project-locally; remove it from the parent or global config."
          : selection.type === "installer" && selection.installer.status === "modified"
            ? "\n\nThe installed revision differs from the registry pin; enabling replaces the managed source and reruns setup."
            : selection.type === "installer" && selection.installer.status === "conflict"
              ? "\n\nAn external installation owns this namespace; manager will refuse to replace or remove it."
              : selection.type === "skill-source" && hasConflict
                ? "\n\nOne or more skills conflict with or were modified in the project; approved replacements or removals are archived first."
                : selection.type === "skill" && ["conflict", "modified"].includes(selection.skill.status)
                  ? "\n\nThis skill conflicts with or was modified in the project; manager will not overwrite it."
                  : selection.type === "rule" && ["conflict", "modified"].includes(selection.rule.status)
                    ? "\n\nThis rule conflicts with or was modified in the project; an approved replacement is archived first."
                    : selection.type === "agent" && ["conflict", "modified"].includes(selection.agent.status)
                      ? selection.agent.ownership === "inherited"
                        ? "\n\nA same-name inherited agent exists; enabling this resource will shadow it only in this project."
                        : "\n\nThis agent resource conflicts with or was modified in the project; an approved replacement is archived first."
                      : "";
  const busy = activeSessionBusy(state.api)
    ? "\n\nThe active session is busy and may be interrupted when OpenCode reloads."
    : "";
  const scopeMessage =
    selection.type === "installer"
      ? `The pinned installer will be ${enabled ? "run" : "removed"} globally under your home directory.`
      : `${scope} will be ${enabled ? "installed/enabled" : "removed/disabled"} only for this project.`;

  replaceDialog(state, undefined, () =>
    state.api.ui.DialogConfirm({
      title: `${hasConflict ? "Override and " : ""}${enabled ? "enable" : "disable"} ${label}?`,
      message: `${scopeMessage}${conflict}${busy}`,
      onConfirm() {
        void applyToggle(state, selection, enabled, hasConflict);
      },
      onCancel() {
        void selection.parent();
      },
    }),
  );
}

async function syncRemoteRegistry(state: State, force: boolean, silent: boolean): Promise<void> {
  if (!state.syncEnabled) {
    if (!silent) state.api.ui.toast({ variant: "warning", message: "Registry sync is disabled for a custom catalog." });
    return;
  }
  if (state.syncingRegistry) return;
  state.syncingRegistry = true;
  let refresh = false;
  try {
    const api = await manager();
    const result = await api.syncRegistry({ projectRoot: state.projectRoot }, { force });
    state.catalogPath = result.catalogPath;
    state.syncResult = result;
    refresh = !silent;
    if (!silent) {
      state.api.ui.toast({
        variant: result.status === "stale" ? "warning" : "success",
        message:
          result.status === "updated"
            ? `Registry updated to ${result.revision?.slice(0, 8) ?? "latest"}.`
            : result.status === "stale"
              ? `Registry sync failed; using cached snapshot. ${result.error ?? ""}`.trim()
              : "Registry is already current.",
      });
    }
  } catch (error) {
    if (!silent) state.api.ui.toast({ variant: "error", message: errorMessage(error) });
  } finally {
    state.syncingRegistry = false;
  }
  if (refresh) await showManager(state);
}

async function reloadProject(state: State): Promise<void> {
  await state.api.client.instance.dispose({}, { throwOnError: true });
}

function isPartialApply(error: unknown): boolean {
  return typeof error === "object" && error !== null && "partialApplied" in error && error.partialApplied === true;
}

async function applyToggle(state: State, selection: Selection, enabled: boolean, override: boolean): Promise<void> {
  if (state.updating) return;
  state.updating = true;
  const label = selectionLabel(selection);
  let saved = false;
  try {
    const api = await manager();
    if (selection.type === "profile") {
      await api.setProfileEnabled(options(state), selection.profile.id, enabled, { override });
    } else if (selection.type === "mcp") {
      await api.setMcpEnabled(options(state), selection.mcp.id, enabled, { override });
    } else if (selection.type === "plugin") {
      await api.setPluginEnabled(options(state), selection.plugin.id, enabled, { override });
    } else if (selection.type === "installer") {
      state.api.ui.toast({
        variant: "info",
        message: `${enabled ? "Running" : "Removing"} global installer ${label}...`,
        duration: 2500,
      });
      await api.setInstallerEnabled(options(state), selection.installer.id, enabled);
    } else if (selection.type === "skill-source") {
      await api.setSkillSourceEnabled(options(state), selection.source.id, enabled, { override });
    } else if (selection.type === "skill") {
      await api.setSkillEnabled(options(state), selection.skill.source, selection.skill.path, enabled, { override });
    } else if (selection.type === "rule") {
      await api.setRuleEnabled(options(state), selection.rule.id, enabled, { override });
    } else {
      await api.setAgentEnabled(options(state), selection.agent.id, enabled, { override });
    }
    saved = true;
    state.api.ui.toast({ variant: "info", message: `Reloading project resources for ${label}...` });
    await reloadProject(state);
    state.api.ui.toast({
      variant: "success",
      message:
        selection.type === "installer"
          ? `${label} ${enabled ? "installed" : "removed"} globally for OpenCode.`
          : `${label} ${enabled ? "enabled" : "disabled"} for this project.`,
    });
    await selection.parent();
  } catch (error) {
    if (isPartialApply(error)) {
      const reloaded = await reloadProject(state).then(
        () => true,
        () => false,
      );
      state.api.ui.toast({
        variant: "error",
        message: `${errorMessage(error)}${reloaded ? " Project resources were reloaded." : " Restart OpenCode to reload project resources."}`,
      });
      await selection.parent();
      return;
    }
    state.api.ui.toast({
      variant: "error",
      message: saved
        ? `Project files were updated, but OpenCode could not reload: ${errorMessage(error)}. Restart OpenCode.`
        : errorMessage(error),
    });
    if (saved) await selection.parent();
  } finally {
    state.updating = false;
  }
}

const tui: TuiPlugin = async (api, pluginOptions) => {
  if (pluginOptions?.enabled === false) return;
  const worktree = api.state.path.worktree;
  const projectRoot = resolveProjectRoot(worktree, api.state.path.directory);
  const hasCustomCatalog = typeof pluginOptions?.catalog === "string";
  const configuredCatalog = hasCustomCatalog ? String(pluginOptions.catalog) : DEFAULT_CATALOG;
  const state: State = {
    api,
    projectRoot,
    catalogPath: resolve(configuredCatalog),
    syncEnabled: !hasCustomCatalog && pluginOptions?.registrySync !== false,
    syncingRegistry: false,
    updating: false,
    selection: undefined,
  };

  api.keymap.registerLayer({
    commands: [
      {
        name: "opencode_manager_open",
        title: "Project Stack Manager",
        desc: "Manage project MCPs, plugins, installers, rules, agents, skills, and stack profiles",
        category: "Project",
        namespace: "palette",
        slashName: "manager",
        slashAliases: ["project-stack"],
        run: () => showManager(state),
      },
      {
        name: "opencode_manager_sync_registry",
        title: "Sync Manager Registry",
        desc: "Fetch the latest registry snapshot without reinstalling the plugin",
        category: "Project",
        namespace: "palette",
        slashName: "manager-sync",
        run: () => syncRemoteRegistry(state, true, false),
      },
    ],
    bindings: [],
  });
  api.keymap.registerLayer({
    mode: "modal",
    enabled: () => state.selection !== undefined && api.ui.dialog.open && !state.updating,
    bindings: [
      {
        key: "space",
        desc: "Toggle selected project resource",
        group: "Project",
        cmd() {
          if (state.selection) confirmToggle(state, state.selection);
        },
      },
      {
        key: "ctrl+e",
        desc: "Enable selected project resource",
        group: "Project",
        cmd() {
          if (state.selection) confirmToggle(state, state.selection, true);
        },
      },
      {
        key: "ctrl+d",
        desc: "Disable selected project resource",
        group: "Project",
        cmd() {
          if (state.selection) confirmToggle(state, state.selection, false);
        },
      },
    ],
  });
  if (state.syncEnabled) {
    const promise = syncRemoteRegistry(state, false, true);
    state.registrySyncPromise = promise;
    void promise.finally(() => {
      if (state.registrySyncPromise === promise) state.registrySyncPromise = undefined;
    });
  }
};

const plugin = {
  id: "opencode-manager",
  tui,
} satisfies TuiPluginModule & { id: string };

export default plugin;
