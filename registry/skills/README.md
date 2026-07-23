# Custom skill registry

Add one directory per custom skill:

```text
registry/skills/<skill-name>/SKILL.md
```

The OpenCode Manager TUI discovers these skills from the `custom` source in
`registry/catalog.jsonc`. Selecting one copies its complete directory into the
active project's `.opencode/skills/` directory.
