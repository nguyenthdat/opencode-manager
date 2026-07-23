# fn-avoid-global-functions

> Define functions as locals or module fields, never as bare globals

## Why It Matters

`function foo() end` (without `local`) creates a global exactly like any other implicit global assignment — visible everywhere, collidable with any other module's `foo`, and slower to call than a local (a global table lookup vs. a register/upvalue read). This matters even more for functions than for data, since functions are usually called far more often than a config value is read.

## Bad

```lua
-- validators.lua
function validate_email(s)   -- global function -- collides with any other
  return s:match("^[%w.]+@[%w.]+$") ~= nil
end

function validate_phone(s)   -- also global
  return s:match("^%d+$") ~= nil
end
```

## Good

```lua
-- validators.lua
local M = {}

function M.validate_email(s)
  return s:match("^[%w.]+@[%w.]+$") ~= nil
end

function M.validate_phone(s)
  return s:match("^%d+$") ~= nil
end

return M
```

```lua
-- caller.lua
local validators = require("validators")
print(validators.validate_email("a@b.com"))
```

## Locals for Private Helpers

```lua
local M = {}

-- Private helper: local function, not exposed on M, not a global
local function normalize(s)
  return s:lower():gsub("%s+", "")
end

function M.validate_email(s)
  return normalize(s):match("^[%w.]+@[%w.]+$") ~= nil
end

return M
```

## See Also

- [scope-local-by-default](scope-local-by-default.md)
- [api-module-return-table](api-module-return-table.md)
- [anti-global-function-pollution](anti-global-function-pollution.md)
