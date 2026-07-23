# scope-local-by-default

> Always declare variables `local` by default

## Why It Matters

Any assignment without `local` creates or modifies a **global** — a field on `_G` (or the current `_ENV` in 5.2+). Globals are slower to access (a table lookup vs. a register/upvalue access), visible and mutable from anywhere in the program, and a common source of name collisions between modules. Defaulting to `local` is the single highest-leverage habit in Lua.

## Bad

```lua
function process(data)      -- implicitly global function
  result = transform(data)  -- implicitly global variable
  count = count + 1         -- implicitly global, and depends on load order
  return result
end
```

## Good

```lua
local function process(data)
  local result = transform(data)
  count = (count or 0) + 1  -- still avoid globals; see below for a proper fix
  return result
end

-- Properly scoped: state lives in a local upvalue or module table, not _G
local M = {}
local count = 0

function M.process(data)
  local result = transform(data)
  count = count + 1
  return result
end

return M
```

## See Also

- [scope-no-accidental-global](scope-no-accidental-global.md)
- [scope-module-pattern](scope-module-pattern.md)
- [anti-missing-local](anti-missing-local.md)
