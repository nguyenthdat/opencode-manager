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
export declare function loadCatalog(options?: Pick<ManagerOptions, "catalogPath">): Promise<RegistryCatalog>;
export declare function listMcps(options: ManagerOptions): Promise<McpStatus[]>;
export declare function setMcpEnabled(options: ManagerOptions, id: string, enabled: boolean, mutation?: MutationOptions): Promise<McpStatus>;
export declare function listPlugins(options: ManagerOptions): Promise<PluginStatus[]>;
export declare function setPluginEnabled(options: ManagerOptions, id: string, enabled: boolean, mutation?: MutationOptions): Promise<PluginStatus>;
export declare function syncRegistry(options: Pick<ManagerOptions, "projectRoot">, settings?: RegistrySyncSettings): Promise<RegistrySyncResult>;
export declare function listInstallers(options: ManagerOptions): Promise<InstallerStatus[]>;
export declare function setInstallerEnabled(options: ManagerOptions, id: string, enabled: boolean): Promise<InstallerStatus>;
export declare function listSkillSources(options: ManagerOptions): Promise<SkillSourceStatus[]>;
export declare function listSkills(options: ManagerOptions, sourceID: string): Promise<SkillStatus[]>;
export declare function setSkillEnabled(options: ManagerOptions, sourceID: string, skillPath: string, enabled: boolean, mutation?: MutationOptions): Promise<SkillStatus>;
export declare function setSkillSourceEnabled(options: ManagerOptions, sourceID: string, enabled: boolean, mutation?: MutationOptions): Promise<SkillStatus[]>;
export declare function listRules(options: ManagerOptions): Promise<RuleStatus[]>;
export declare function setRuleEnabled(options: ManagerOptions, id: string, enabled: boolean, mutation?: MutationOptions): Promise<RuleStatus>;
export declare function listAgents(options: ManagerOptions): Promise<AgentStatus[]>;
export declare function setAgentEnabled(options: ManagerOptions, id: string, enabled: boolean, mutation?: MutationOptions): Promise<AgentStatus>;
export declare function listProfiles(options: ManagerOptions): Promise<ProfileStatus[]>;
export declare function getProfile(options: ManagerOptions, profileID: string): Promise<ProfileDetail>;
export declare function setProfileEnabled(options: ManagerOptions, profileID: string, enabled: boolean, mutation?: MutationOptions): Promise<ProfileDetail>;
export {};
//# sourceMappingURL=manager.d.ts.map