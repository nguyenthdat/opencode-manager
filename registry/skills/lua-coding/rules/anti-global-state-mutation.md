# anti-global-state-mutation

> Anti-pattern: mutating shared global state from library code

## Why It Matters

A library that reaches out and mutates globals, `_G`, or shared standard-library tables to accomplish its own internal goals affects every other piece of code sharing that Lua state — including unrelated modules, plugins, or requests that have no idea your library touched anything, and no way to opt out.

## Bad

```lua
-- A "helpful" library that patches global state to configure itself
local M = {}

function M.enable_debug_mode()
  _G.DEBUG = true                     -- pollutes the global namespace
  string.format = function(...)        -- monkey-patches a shared stdlib function
    print("[debug] formatting")
    return _G.string.format(...)  -- oops, infinite recursion risk too
  end
end

return M
```

## Good

```lua
-- Library owns its own state, exposes explicit configuration, touches
-- nothing outside itself
local M = { debug = false }

function M.enable_debug_mode()
  M.debug = true
end

function M.format(...)
  if M.debug then print("[debug] formatting") end
  return string.format(...)   -- calls the real, untouched stdlib function
end

return M
```

## Even "Just Reading" Shared Globals Can Be a Smell

Beyond mutation, even reading ambient global state (rather than receiving it as an explicit parameter/dependency) makes a library's behavior depend on invisible context — prefer dependency injection (see `test-mock-tables`) over implicit global reads wherever practical.

## See Also

- [api-no-monkey-patching](api-no-monkey-patching.md)
- [scope-module-pattern](scope-module-pattern.md)
- [anti-deep-nested-mutation](anti-deep-nested-mutation.md)
