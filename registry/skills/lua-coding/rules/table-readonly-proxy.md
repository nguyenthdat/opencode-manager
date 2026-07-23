# table-readonly-proxy

> Use a `__newindex` proxy to expose read-only constant tables

## Why It Matters

Lua has no built-in immutability for tables (5.4's `<const>` only prevents *reassigning the variable*, not mutating the table it points to). When a module exposes shared configuration or constant lookup tables, an accidental `M.LIMITS.max = 10` from calling code silently corrupts shared state for every other user of the module. A read-only proxy makes that a hard error instead.

## Bad

```lua
-- M.LIMITS is a plain table -- any caller can mutate it
local M = {}
M.LIMITS = { max_retries = 3, timeout_ms = 5000 }
return M

-- elsewhere, an innocent-looking typo silently corrupts shared state:
local limits = require("config").LIMITS
limits.max_retries = 30   -- oops, mutated the shared table, no error
```

## Good

```lua
local function readonly(t)
  local proxy = {}
  local mt = {
    __index = t,
    __newindex = function(_, key, _)
      error("attempt to modify read-only table (key = " .. tostring(key) .. ")", 2)
    end,
    __pairs = function() return pairs(t) end,
    __len = function() return #t end,
  }
  return setmetatable(proxy, mt)
end

local M = {}
M.LIMITS = readonly({ max_retries = 3, timeout_ms = 5000 })
return M

-- elsewhere:
local limits = require("config").LIMITS
limits.max_retries = 30   -- error: attempt to modify read-only table (key = max_retries)
```

## See Also

- [scope-const-attribute](scope-const-attribute.md)
- [meta-newindex-guard](meta-newindex-guard.md)
- [api-no-monkey-patching](api-no-monkey-patching.md)
