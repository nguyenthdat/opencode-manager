# api-module-return-table

> Return a module table (`return M`) instead of relying on globals

## Why It Matters

The `require` mechanism is built around a module returning a value — callers get exactly what the module returns, cached by module name, and nothing more. Returning a table with clearly named fields makes a module's public surface explicit and lets multiple modules coexist without namespace collisions, unlike the legacy pre-5.2 `module()` function which injected globals.

## Bad

```lua
-- stringutils.lua -- old-style module() pattern (removed in Lua 5.2+, and
-- even where available in 5.1, it pollutes globals and is deprecated)
module("stringutils", package.seeall)

function trim(s)
  return s:match("^%s*(.-)%s*$")
end
```

## Good

```lua
-- stringutils.lua
local M = {}

function M.trim(s)
  return s:match("^%s*(.-)%s*$")
end

function M.split(s, sep)
  local parts = {}
  for part in s:gmatch("([^" .. sep .. "]+)") do
    table.insert(parts, part)
  end
  return parts
end

return M
```

```lua
-- caller.lua
local strutil = require("stringutils")
print(strutil.trim("  hello  "))
```

## See Also

- [scope-module-pattern](scope-module-pattern.md)
- [api-no-monkey-patching](api-no-monkey-patching.md)
- [proj-require-path-convention](proj-require-path-convention.md)
