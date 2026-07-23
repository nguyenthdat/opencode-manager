# proj-avoid-circular-require

> Avoid circular `require()` dependencies between modules

## Why It Matters

`require` caches a module in `package.loaded` *before* the module's file has finished executing (the entry is set to the in-progress return value, historically `true`, as soon as loading begins) — so if module A requires B, and B in turn requires A while A is still mid-load, B receives an incomplete (or `true`/placeholder) version of A instead of A's finished module table, often resulting in a `nil`/wrong-shaped value used silently.

## Bad

```lua
-- a.lua
local b = require("b")
local M = { name = "a" }
function M.greet() return "hello from " .. b.name end  -- b might be incomplete here
return M
```

```lua
-- b.lua
local a = require("a")   -- circular: a.lua is still mid-execution when this runs
local M = { name = "b" }
function M.greet() return "hello from " .. a.name end  -- a.name may be nil here!
return M
```

## Good

```lua
-- Break the cycle: extract the shared piece both modules need into a
-- third module that neither A nor B needs to depend on the other for
-- shared.lua
return { name_for = function(id) return "module " .. id end }
```

```lua
-- a.lua -- no longer requires b at all
local shared = require("shared")
local M = { name = "a" }
function M.greet() return "hello from " .. shared.name_for("a") end
return M
```

```lua
-- b.lua -- no longer requires a
local shared = require("shared")
local M = { name = "b" }
function M.greet() return "hello from " .. shared.name_for("b") end
return M
```

## Lazy `require` as a Workaround

If restructuring isn't immediately feasible, `require` the circular dependency *inside* the function that needs it (deferring the require until after both modules have fully loaded) rather than at the top of the file — a pragmatic stopgap, not a long-term fix:

```lua
function M.greet()
  local b = require("b")  -- deferred: by the time this runs, b is fully loaded
  return "hello from " .. b.name
end
```

## See Also

- [proj-single-responsibility-module](proj-single-responsibility-module.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
- [embed-game-engine-hot-reload](embed-game-engine-hot-reload.md)
