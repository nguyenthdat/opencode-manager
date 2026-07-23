# scope-strict-mode

> Enable a "strict globals" guard during development

## Why It Matters

Because Lua allows implicit globals by default, the cheapest way to catch `scope-no-accidental-global` mistakes automatically is a small `strict.lua` module (the same idea as Roberto Ierusalimschy's `strict.lua` shipped with the reference Lua distribution) that raises an error the instant undeclared global read/write happens, rather than letting it silently succeed.

## Bad

```lua
-- No strict-mode guard: a typo becomes a silent global instead of a crash
local function render(state)
  scaleFactor = state.scale  -- typo for a local `scale_factor` -- leaks global
  return scaleFactor * state.base
end
```

## Good

```lua
-- strict.lua (load this once, early, in development/test builds only)
local mt = {}
setmetatable(_G, mt)

mt.__newindex = function(_, name, value)
  error("attempt to write to undeclared global '" .. name .. "'", 2)
end

mt.__index = function(_, name)
  error("attempt to read undeclared global '" .. name .. "'", 2)
end

-- main.lua
if os.getenv("LUA_ENV") == "development" then
  require("strict")
end

local function render(state)
  scaleFactor = state.scale  -- now raises immediately: easy to spot and fix
  return scaleFactor * state.base
end
```

## When to Disable It

Never ship the strict guard in a release build for latency-sensitive code (it adds a metatable indirection to every global access) — gate it behind an environment variable or build flag, and rely on `luacheck` in CI for the always-on version of this check.

## See Also

- [scope-no-accidental-global](scope-no-accidental-global.md)
- [lint-luacheck-ci](lint-luacheck-ci.md)
- [embed-sandbox-restrict-env](embed-sandbox-restrict-env.md)
