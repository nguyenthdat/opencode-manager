# scope-no-accidental-global

> Guard against accidental globals created by a missing `local`

## Why It Matters

A single missing `local` keyword — often from a typo in a variable name inside a nested scope — silently creates a global instead of raising an error. This is one of the most common classes of Lua bugs, especially costly in long-running processes (game loops, Neovim, nginx workers) where the leaked global persists and interacts unpredictably with later code.

## Bad

```lua
local function update(state)
  for i = 1, 10 do
    total = total + i    -- typo: meant `local total`, this leaks a global
  end
  state.total = total
end
```

## Good

```lua
local function update(state)
  local total = 0
  for i = 1, 10 do
    total = total + i
  end
  state.total = total
end

-- Enforce this at the language level during development: forbid new
-- globals entirely by locking down _G with a metatable guard.
setmetatable(_G, {
  __newindex = function(_, key, _)
    error("attempt to create global '" .. key .. "'", 2)
  end,
  __index = function(_, key)
    error("attempt to read undefined global '" .. key .. "'", 2)
  end,
})
```

## Catching It With Tooling

`luacheck` reports both "setting non-standard global variable" (W111) and "accessing undefined variable" (W113) by default — enable it in CI so a missing `local` fails the build instead of shipping.

## See Also

- [scope-local-by-default](scope-local-by-default.md)
- [scope-strict-mode](scope-strict-mode.md)
- [lint-luacheck-ci](lint-luacheck-ci.md)
