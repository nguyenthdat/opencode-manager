import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const DEFAULT_CATALOG = fileURLToPath(new URL("../registry/catalog.jsonc", import.meta.url));
function isSelection(value) {
    return ["profile", "mcp", "skill", "rule", "agent"].includes(value.type);
}
export function resolveProjectRoot(worktree, directory) {
    return resolve(worktree && worktree !== "/" ? worktree : directory);
}
function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
function options(state) {
    const mcp = state.api.state.config?.mcp;
    const agent = state.api.state.config?.agent;
    return {
        projectRoot: state.projectRoot,
        catalogPath: state.catalogPath,
        effectiveMcp: mcp && typeof mcp === "object" && !Array.isArray(mcp) ? mcp : undefined,
        effectiveAgent: agent && typeof agent === "object" && !Array.isArray(agent) ? agent : undefined,
    };
}
async function manager() {
    return import("./manager.js");
}
function runtimeStatus(state, id) {
    return state.api.state.mcp().find((item) => item.name === id);
}
function profileFooter(profile) {
    if (profile.status === "conflict")
        return `conflict · ${profile.enabledResources}/${profile.totalResources} selected`;
    return `${profile.status} · ${profile.enabledResources}/${profile.totalResources} selected`;
}
function mcpFooter(state, mcp) {
    if (mcp.status === "conflict")
        return `conflict · ${mcp.ownership}`;
    const live = runtimeStatus(state, mcp.id);
    if (!mcp.enabled)
        return `${mcp.status} · ${mcp.ownership}`;
    if (!live)
        return `enabled · ${mcp.ownership} · runtime pending`;
    if (live.status === "failed" && live.error)
        return `enabled · failed: ${live.error}`;
    return `enabled · ${live.status.replaceAll("_", " ")} · ${mcp.ownership}`;
}
function skillFooter(skill) {
    const nested = skill.nestedSkills ? ` · includes ${skill.nestedSkills} nested` : "";
    return `${skill.status}${nested}`;
}
function ruleFooter(rule) {
    return `${rule.status} · ${rule.ownership}`;
}
function agentFooter(agent) {
    const members = agent.type === "team" ? ` · ${agent.members} members` : "";
    return `${agent.status} · ${agent.ownership} · ${agent.type}${members}`;
}
function sourceFooter(source) {
    const pin = source.revision ? ` · ${source.revision.slice(0, 8)}` : "";
    return `${source.installed} installed${pin}`;
}
function replaceDialog(state, selection, render, onClose) {
    const token = Symbol("opencode-manager-dialog");
    state.dialogToken = token;
    state.selection = selection;
    state.api.ui.dialog.setSize("large");
    state.api.ui.dialog.replace(render, () => {
        if (state.dialogToken !== token)
            return;
        state.dialogToken = undefined;
        state.selection = undefined;
        onClose?.();
    });
}
function navigation(title) {
    return { title, value: { type: "back" }, category: "Navigation" };
}
async function showManager(state) {
    try {
        const api = await manager();
        const [profiles, sources] = await Promise.all([
            api.listProfiles(options(state)),
            api.listSkillSources(options(state)),
        ]);
        const rows = [
            ...profiles.map((profile) => ({
                title: profile.title,
                value: { type: "open-profile", profile },
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
                title: "Rule Registry",
                value: { type: "rules" },
                description: "Install project instructions and keep project config references in sync",
                category: "Registries",
            },
            {
                title: "Agent Registry",
                value: { type: "agents" },
                description: "Install standalone agents or complete agent teams",
                category: "Registries",
            },
            ...sources.map((source) => ({
                title: source.title,
                value: { type: "open-source", source },
                description: source.repository ?? "Skills maintained in this repository",
                footer: sourceFooter(source),
                category: "Skill Registries",
            })),
        ];
        replaceDialog(state, undefined, () => state.api.ui.DialogSelect({
            title: "Project Stack Manager",
            placeholder: "Search profiles, MCPs, rules, agents, or skills",
            options: rows,
            onMove() {
                state.selection = undefined;
            },
            onFilter() {
                state.selection = undefined;
            },
            onSelect(option) {
                if (option.value.type === "open-profile")
                    void showProfile(state, option.value.profile.id);
                if (option.value.type === "mcps")
                    void showMcps(state);
                if (option.value.type === "rules")
                    void showRules(state);
                if (option.value.type === "agents")
                    void showAgents(state);
                if (option.value.type === "open-source")
                    void showSource(state, option.value.source.id);
            },
        }));
    }
    catch (error) {
        state.api.ui.toast({ variant: "error", message: errorMessage(error) });
    }
}
async function showProfile(state, profileID) {
    state.api.ui.toast({ variant: "info", message: "Loading pinned profile resources...", duration: 1500 });
    try {
        const api = await manager();
        const detail = await api.getProfile(options(state), profileID);
        const parent = () => showProfile(state, profileID);
        const rows = [
            navigation("Back to manager"),
            {
                title: "All profile resources",
                value: { type: "profile", profile: detail.profile, parent },
                description: "Apply this profile's MCPs and curated skills to the active project",
                footer: profileFooter(detail.profile),
                category: "Profile",
            },
            ...detail.mcps.map((mcp) => ({
                title: mcp.title,
                value: { type: "mcp", mcp, parent },
                description: mcp.description,
                footer: mcpFooter(state, mcp),
                category: "MCPs",
            })),
            ...detail.skills.map((skill) => ({
                title: skill.name,
                value: { type: "skill", skill, parent },
                description: `${skill.sourceTitle}: ${skill.description}`,
                footer: skillFooter(skill),
                category: "Skills",
            })),
            ...detail.rules.map((rule) => ({
                title: rule.title,
                value: { type: "rule", rule, parent },
                description: rule.description,
                footer: ruleFooter(rule),
                category: "Rules",
            })),
            ...detail.agents.map((agent) => ({
                title: agent.title,
                value: { type: "agent", agent, parent },
                description: agent.description,
                footer: agentFooter(agent),
                category: agent.type === "team" ? "Agent Teams" : "Agents",
            })),
        ];
        replaceDialog(state, undefined, () => state.api.ui.DialogSelect({
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
                if (option.value.type === "back")
                    void showManager(state);
                else if (isSelection(option.value))
                    confirmToggle(state, option.value);
            },
        }));
    }
    catch (error) {
        state.api.ui.toast({ variant: "error", message: errorMessage(error) });
        await showManager(state);
    }
}
async function showMcps(state) {
    try {
        const api = await manager();
        const mcps = await api.listMcps(options(state));
        const parent = () => showMcps(state);
        const rows = [
            navigation("Back to manager"),
            ...mcps.map((mcp) => ({
                title: mcp.title,
                value: { type: "mcp", mcp, parent },
                description: `${mcp.description} [${mcp.id}]`,
                footer: mcpFooter(state, mcp),
                category: mcp.tags[0] ?? "MCPs",
            })),
        ];
        replaceDialog(state, undefined, () => state.api.ui.DialogSelect({
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
                if (option.value.type === "back")
                    void showManager(state);
                else if (isSelection(option.value))
                    confirmToggle(state, option.value);
            },
        }));
    }
    catch (error) {
        state.api.ui.toast({ variant: "error", message: errorMessage(error) });
    }
}
async function showRules(state) {
    try {
        const api = await manager();
        const rules = await api.listRules(options(state));
        const parent = () => showRules(state);
        const rows = [
            navigation("Back to manager"),
            ...rules.map((rule) => ({
                title: rule.title,
                value: { type: "rule", rule, parent },
                description: `${rule.description} [${rule.id}]`,
                footer: ruleFooter(rule),
                category: rule.tags[0] ?? "Rules",
            })),
        ];
        replaceDialog(state, undefined, () => state.api.ui.DialogSelect({
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
                if (option.value.type === "back")
                    void showManager(state);
                else if (isSelection(option.value))
                    confirmToggle(state, option.value);
            },
        }));
    }
    catch (error) {
        state.api.ui.toast({ variant: "error", message: errorMessage(error) });
    }
}
async function showAgents(state) {
    try {
        const api = await manager();
        const agents = await api.listAgents(options(state));
        const parent = () => showAgents(state);
        const rows = [
            navigation("Back to manager"),
            ...agents.map((agent) => ({
                title: agent.title,
                value: { type: "agent", agent, parent },
                description: `${agent.description} [${agent.id}]`,
                footer: agentFooter(agent),
                category: agent.type === "team" ? "Agent Teams" : agent.tags[0] ?? "Agents",
            })),
        ];
        replaceDialog(state, undefined, () => state.api.ui.DialogSelect({
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
                if (option.value.type === "back")
                    void showManager(state);
                else if (isSelection(option.value))
                    confirmToggle(state, option.value);
            },
        }));
    }
    catch (error) {
        state.api.ui.toast({ variant: "error", message: errorMessage(error) });
    }
}
async function showSource(state, sourceID) {
    state.api.ui.toast({ variant: "info", message: "Loading pinned skill registry...", duration: 1500 });
    try {
        const api = await manager();
        const [sources, skills] = await Promise.all([
            api.listSkillSources(options(state)),
            api.listSkills(options(state), sourceID),
        ]);
        const source = sources.find((item) => item.id === sourceID);
        if (!source)
            throw new Error(`Unknown skill source ${sourceID}`);
        const parent = () => showSource(state, sourceID);
        const rows = [
            navigation("Back to manager"),
            ...skills.map((skill) => ({
                title: skill.name,
                value: { type: "skill", skill, parent },
                description: skill.description,
                footer: skillFooter(skill),
                category: skill.path.includes("/") ? skill.path.split("/")[0] : "Skills",
            })),
        ];
        if (skills.length === 0) {
            state.api.ui.toast({ variant: "warning", message: `${source.title} has no skills yet.` });
        }
        replaceDialog(state, undefined, () => state.api.ui.DialogSelect({
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
                if (option.value.type === "back")
                    void showManager(state);
                else if (isSelection(option.value))
                    confirmToggle(state, option.value);
            },
        }));
    }
    catch (error) {
        state.api.ui.toast({ variant: "error", message: errorMessage(error) });
        await showManager(state);
    }
}
function selectionEnabled(selection) {
    if (selection.type === "profile")
        return selection.profile.status === "enabled";
    if (selection.type === "mcp")
        return selection.mcp.enabled;
    if (selection.type === "skill")
        return selection.skill.status === "managed" || selection.skill.status === "modified";
    if (selection.type === "rule")
        return selection.rule.status === "managed" || selection.rule.status === "modified";
    if (selection.type === "agent")
        return selection.agent.status === "managed" || selection.agent.status === "modified";
    return false;
}
function selectionLabel(selection) {
    if (selection.type === "profile")
        return selection.profile.title;
    if (selection.type === "mcp")
        return selection.mcp.title;
    if (selection.type === "skill")
        return selection.skill.name;
    if (selection.type === "rule")
        return selection.rule.title;
    if (selection.type === "agent")
        return selection.agent.title;
    return "resource";
}
function activeSessionBusy(api) {
    const current = api.route.current;
    if (current.name !== "session" || !current.params)
        return false;
    const sessionID = current.params.sessionID;
    if (typeof sessionID !== "string")
        return false;
    const status = api.state.session.status(sessionID);
    return status?.type === "busy" || status?.type === "retry";
}
function selectionConflict(selection) {
    if (selection.type === "profile")
        return selection.profile.status === "conflict";
    if (selection.type === "mcp")
        return selection.mcp.status === "conflict";
    if (selection.type === "skill")
        return selection.skill.status === "conflict" || selection.skill.status === "modified";
    if (selection.type === "rule")
        return selection.rule.status === "conflict" || selection.rule.status === "modified";
    return selection.agent.status === "conflict" || selection.agent.status === "modified";
}
function confirmToggle(state, selection, forcedEnabled) {
    const enabled = forcedEnabled ?? !selectionEnabled(selection);
    const label = selectionLabel(selection);
    const scope = selection.type === "profile" ? "Every registry resource in this profile" : "This resource";
    const hasConflict = selectionConflict(selection);
    const conflict = selection.type === "mcp" && selection.mcp.status === "conflict"
        ? "\n\nThis MCP conflicts with an existing definition and the operation will be refused."
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
    replaceDialog(state, undefined, () => state.api.ui.DialogConfirm({
        title: `${hasConflict ? "Override and " : ""}${enabled ? "enable" : "disable"} ${label}?`,
        message: `${scope} will be ${enabled ? "installed/enabled" : "removed/disabled"} only for this project.${conflict}${busy}`,
        onConfirm() {
            void applyToggle(state, selection, enabled, hasConflict);
        },
        onCancel() {
            void selection.parent();
        },
    }));
}
async function reloadProject(state) {
    await state.api.client.instance.dispose({}, { throwOnError: true });
}
function isPartialApply(error) {
    return typeof error === "object" && error !== null && "partialApplied" in error && error.partialApplied === true;
}
async function applyToggle(state, selection, enabled, override) {
    if (state.updating)
        return;
    state.updating = true;
    const label = selectionLabel(selection);
    let saved = false;
    try {
        const api = await manager();
        if (selection.type === "profile") {
            await api.setProfileEnabled(options(state), selection.profile.id, enabled, { override });
        }
        else if (selection.type === "mcp") {
            await api.setMcpEnabled(options(state), selection.mcp.id, enabled, { override });
        }
        else if (selection.type === "skill") {
            await api.setSkillEnabled(options(state), selection.skill.source, selection.skill.path, enabled, { override });
        }
        else if (selection.type === "rule") {
            await api.setRuleEnabled(options(state), selection.rule.id, enabled, { override });
        }
        else {
            await api.setAgentEnabled(options(state), selection.agent.id, enabled, { override });
        }
        saved = true;
        state.api.ui.toast({ variant: "info", message: `Reloading project resources for ${label}...` });
        await reloadProject(state);
        state.api.ui.toast({
            variant: "success",
            message: `${label} ${enabled ? "enabled" : "disabled"} for this project.`,
        });
        await selection.parent();
    }
    catch (error) {
        if (isPartialApply(error)) {
            const reloaded = await reloadProject(state).then(() => true, () => false);
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
        if (saved)
            await selection.parent();
    }
    finally {
        state.updating = false;
    }
}
const tui = async (api, pluginOptions) => {
    if (pluginOptions?.enabled === false)
        return;
    const worktree = api.state.path.worktree;
    const projectRoot = resolveProjectRoot(worktree, api.state.path.directory);
    const configuredCatalog = typeof pluginOptions?.catalog === "string" ? pluginOptions.catalog : DEFAULT_CATALOG;
    const state = {
        api,
        projectRoot,
        catalogPath: resolve(configuredCatalog),
        updating: false,
        selection: undefined,
    };
    api.keymap.registerLayer({
        commands: [
            {
                name: "opencode_manager_open",
                title: "Project Stack Manager",
                desc: "Manage project MCPs, rules, agents, skills, and stack profiles",
                category: "Project",
                namespace: "palette",
                slashName: "manager",
                slashAliases: ["project-stack"],
                run: () => showManager(state),
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
                    if (state.selection)
                        confirmToggle(state, state.selection);
                },
            },
            {
                key: "ctrl+e",
                desc: "Enable selected project resource",
                group: "Project",
                cmd() {
                    if (state.selection)
                        confirmToggle(state, state.selection, true);
                },
            },
            {
                key: "ctrl+d",
                desc: "Disable selected project resource",
                group: "Project",
                cmd() {
                    if (state.selection)
                        confirmToggle(state, state.selection, false);
                },
            },
        ],
    });
};
const plugin = {
    id: "opencode-manager",
    tui,
};
export default plugin;
//# sourceMappingURL=tui.js.map