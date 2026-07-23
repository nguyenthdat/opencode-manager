# api-backward-compat-field

> Keep deprecated fields/functions as aliases during migration

## Why It Matters

Because Lua has no compiler-enforced interface versioning, renaming a public field or function outright breaks every existing caller the moment the new version ships, with no warning. Keeping the old name as a thin, deprecated alias (optionally logging a warning) gives consumers a migration window instead of an instant break.

## Bad

```lua
-- v2.0.0: renamed M.fetchData to M.fetch_data (style cleanup), old name just gone
local M = {}
function M.fetch_data(url) ... end
return M

-- Every caller still using M.fetchData now gets:
-- attempt to call a nil value (field 'fetchData')
```

## Good

```lua
-- v2.0.0: new name is primary, old name kept as a deprecated alias
local M = {}

function M.fetch_data(url) ... end

-- Deprecated alias: still works, but warns so callers know to migrate
function M.fetchData(url)
  io.stderr:write("warning: M.fetchData is deprecated, use M.fetch_data instead\n")
  return M.fetch_data(url)
end

return M
```

## Deprecating a Whole Module

```lua
-- old_module.lua -- kept only as a redirect during a migration window
io.stderr:write("warning: require('old_module') is deprecated; use require('new_module')\n")
return require("new_module")
```

## Removing the Alias Later

Document a clear deprecation timeline (e.g. in `CHANGELOG.md`/release notes: "deprecated in 2.0, removed in 3.0") so the alias isn't kept forever, and remove it in a deliberate major version bump.

## See Also

- [api-version-field](api-version-field.md)
- [doc-changelog](doc-changelog.md)
- [api-module-return-table](api-module-return-table.md)
