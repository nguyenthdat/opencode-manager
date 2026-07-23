# Opencode Manager

OpenCode TUI plugin for selecting the MCP servers and agent skills that belong
to each project. It combines a repository-owned MCP registry, a custom skill
registry, pinned vendor skill sources, and reusable stack profiles.

The manager never writes MCPs or skills to OpenCode's global config. Every
selection is materialized under the active worktree's `.opencode/` directory.

## What it manages

- **MCP registry:** complete local and remote MCP definitions in
  `registry/catalog.jsonc`.
- **Custom skills:** skills maintained in this repository under
  `registry/skills/<name>/SKILL.md`.
- **Vendor skills:** reproducible, commit-pinned skill repositories from
  Cloudflare, ClickHouse, Redpanda, Qdrant, Windmill, and future vendors.
- **Profiles:** curated MCP and skill groups for a project stack or scope, such
  as Cloudflare, ClickHouse, browser automation, security, or Rust.
- **Individual resources:** every MCP and top-level skill bundle can also be
  enabled or disabled separately.

## Project scope

The plugin patches the first existing project config in this order:
`.opencode/opencode.jsonc`, `.opencode/opencode.json`, `opencode.jsonc`, then
`opencode.json`. If none exists, it creates `.opencode/opencode.jsonc`. Other
managed files stay under `.opencode/`:

```text
.opencode/
├── opencode.jsonc
├── skills/
│   └── <selected-skill>/
└── .opencode-manager/
    ├── .gitignore
    ├── state.json
    ├── backups/               # preserved overrides and disabled skills
    └── cache/                 # ignored vendor Git cache
```

Commit `.opencode/opencode.jsonc`, selected `.opencode/skills/`, and
`.opencode/.opencode-manager/state.json` when the selected stack should be
shared by the project. The vendor cache and lock files are ignored.
Local backups are ignored as well because they may contain project-specific
configuration or skill content.

## Install

OpenCode 1.18.4 or newer is required because this package uses the current TUI
plugin API.

Install the plugin globally when you want the manager available in every
project while keeping all managed resources project-local:

```bash
opencode plugin --global @nguyenthdat/opencode-manager
```

Alternatively, add it to a project's `.opencode/tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["@nguyenthdat/opencode-manager"]
}
```

For local development:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["/absolute/path/to/opencode-manager/dist/tui.js"]
}
```

Quit and restart OpenCode after changing `tui.json` or installing the plugin.

## Use

Open `/manager` or choose **Project Stack Manager** from the command palette.

The first screen contains:

- Stack profiles, with the number of selected resources.
- The complete MCP registry.
- Custom and vendor skill registries.

Inside a profile or registry:

- `Enter` or `Space` toggles the selected resource.
- `Ctrl+E` enables it.
- `Ctrl+D` disables it.

Applying a change reloads the active OpenCode project instance once so MCP and
skill state is refreshed. If reload fails after files were written, restart
OpenCode manually.

## MCP registry

Add MCPs to `registry/catalog.jsonc` under `mcps`. A registry entry contains UI
metadata and a valid OpenCode MCP config:

```jsonc
{
  "mcps": {
    "postgres": {
      "title": "PostgreSQL",
      "description": "Inspect and query the project database.",
      "tags": ["database", "postgres"],
      "config": {
        "type": "local",
        "command": ["bunx", "-y", "@example/postgres-mcp"],
        "environment": {
          "DATABASE_URL": "{env:DATABASE_URL}"
        },
        "enabled": false
      }
    }
  }
}
```

Use `{env:VARIABLE}` or `{file:path}` references for credentials. Never commit a
resolved token or secret to the registry.

When an MCP is enabled:

1. If no effective same-name MCP exists, its full registry definition is added
   to the existing project config, or to `.opencode/opencode.jsonc` for a new
   config.
2. If an inherited definition exactly matches, only a project-level
   `{ "enabled": true }` override is written.
3. If a same-name definition differs, the operation is refused instead of
   enabling an unrelated command or URL. The TUI asks whether to override it;
   an approved project MCP override is backed up first.
4. Manager-installed definitions receive a fingerprint so registry updates can
   be applied only while the project copy remains unmodified.

## Custom skill registry

Create a normal OpenCode skill in this repository:

```text
registry/skills/my-skill/SKILL.md
```

The manifest must have a valid name and non-empty description:

```markdown
---
name: my-skill
description: Use when the project needs this specific workflow.
---

# My Skill
```

The TUI discovers it automatically under **OpenCode Manager Registry**. The
entire skill directory, including scripts, references, assets, and nested
skills, is copied as one bundle.

The bundled registry currently includes 27 custom skills:

- **Engineering workflows:** [`application-debugging`](registry/skills/application-debugging),
  [`native-binary-debugging`](registry/skills/native-binary-debugging),
  [`security-review`](registry/skills/security-review),
  [`software-architect`](registry/skills/software-architect),
  [`codebase-design`](registry/skills/codebase-design),
  [`design-patterns`](registry/skills/design-patterns), and
  [`uniffi`](registry/skills/uniffi).
- **Language guidance:** Assembly, Bash, C, C++, C#, Go, Groovy, Java,
  JavaScript, Kotlin, Lua, Objective-C, PHP, PowerShell, Python, Ruby, Rust,
  Swift, TypeScript, and Zig.

See [`registry/skills/README.md`](registry/skills/README.md) for the complete
catalog and each skill's scope.

If the destination skill already exists or a managed copy was edited, the TUI
asks before overriding it. Approved overrides preserve the previous directory
under `.opencode/.opencode-manager/backups/skills/override/`. Disabling a
manager-owned skill moves it to `backups/skills/disabled/` instead of deleting
it permanently.

## Vendor skill registry

Vendor sources live under `skillSources`:

```jsonc
{
  "skillSources": {
    "vendor": {
      "type": "git",
      "title": "Vendor Skills",
      "repository": "https://github.com/vendor/skills.git",
      "revision": "0123456789abcdef0123456789abcdef01234567",
      "skillsPath": "skills",
      "license": "Apache-2.0"
    }
  }
}
```

`revision` must be a complete commit SHA. Updating a vendor means reviewing its
changes and changing that SHA in the registry. The plugin does not silently
follow a mutable branch.

For repositories with nested skills, the top-level directory containing a
`SKILL.md` is treated as the selectable bundle. Descendant skills are included
and displayed as part of that bundle.

## Profiles

Profiles combine MCP IDs and exact skill source paths:

```jsonc
{
  "profiles": [
    {
      "id": "data-platform",
      "title": "Data Platform",
      "description": "Database MCPs and project-specific data skills.",
      "tags": ["data"],
      "mcps": ["postgres"],
      "skills": [
        { "source": "custom", "path": "schema-review" },
        { "source": "clickhouse", "path": "clickhouse-best-practices" }
      ]
    }
  ]
}
```

Profile actions manage only resources declared by the registry. They never
disable or remove unrelated MCPs or unmanaged project skills.

## Safety model

- Project config is edited with targeted JSONC changes, preserving comments and
  unrelated settings. The manager never deletes or replaces the complete
  project config file.
- Duplicate JSON keys and malformed catalog/config files fail closed.
- MCP collisions are refused before a server can be enabled.
- Vendor sources use HTTPS and immutable commits; Git credential prompts,
  submodules, and checkout hooks are disabled.
- Skill symlinks, special files, traversal, oversized files, and oversized
  bundles are rejected.
- Existing or modified skills require an explicit override confirmation and
  are backed up before replacement.
- Disabled skills are archived, not permanently deleted.
- Managed skills are updated without confirmation only when their tree digest
  still matches the last installed version.

## Development

```bash
bun install
bun run build
bun run typecheck
bun test
```

Release and npm Trusted Publishing instructions are in
[`docs/RELEASING.md`](https://github.com/nguyenthdat/opencode-manager/blob/main/docs/RELEASING.md).
