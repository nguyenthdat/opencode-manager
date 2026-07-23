# anti-global-function-pollution

> Anti-pattern: defining functions as globals instead of locals/module fields

## Why It Matters

`function foo() end` without `local` creates a global exactly as surely as `foo = 1` would — and because functions are usually the *most* frequently called things in a program, the cost (both in collision risk and in the extra lookup cost of every call) compounds more than with ordinary global data.

## Bad

```lua
-- utils.lua
function trim(s)                 -- global function: collides with ANY other
  return s:match("^%s*(.-)%s*$")  -- module that also happens to define `trim`
end

function format_date(t)          -- also global -- same risk
  return os.date("%Y-%m-%d", t)
end
```

```lua
-- another_module.lua, loaded later, silently overwrites the first module's trim
function trim(s)
  return s:gsub("%s", "")   -- completely different behavior, same global name!
end
```

## Good

```lua
-- utils.lua
local M = {}

function M.trim(s)
  return s:match("^%s*(.-)%s*$")
end

function M.format_date(t)
  return os.date("%Y-%m-%d", t)
end

return M
```

```lua
local utils = require("utils")
print(utils.trim("  hi  "))  -- no collision risk, explicit dependency
```

## See Also

- [fn-avoid-global-functions](fn-avoid-global-functions.md)
- [scope-local-by-default](scope-local-by-default.md)
- [api-module-return-table](api-module-return-table.md)
