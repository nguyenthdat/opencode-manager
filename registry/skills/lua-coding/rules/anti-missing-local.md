# anti-missing-local

> Anti-pattern: a missing `local` keyword silently creates a global

## Why It Matters

This is the single most common Lua bug: `x = 1` inside a function body, meant as `local x = 1`, compiles and runs without complaint — it just quietly creates or overwrites a global instead. Because Lua never errors on this, the bug usually surfaces much later and far away, as some unrelated code observes an unexpected global value.

## Bad

```lua
local function calculate_total(items)
  total = 0                     -- missing `local` -- leaks a global named `total`
  for _, item in ipairs(items) do
    total = total + item.price
  end
  return total
end

calculate_total({ { price = 10 } })
print(total)  -- 10 -- a global now exists that shouldn't, visible everywhere
```

## Good

```lua
local function calculate_total(items)
  local total = 0
  for _, item in ipairs(items) do
    total = total + item.price
  end
  return total
end

calculate_total({ { price = 10 } })
print(total)  -- nil, correctly -- no leaked global
```

## Catch It Automatically

Run `luacheck` in CI (flags this as warning W111/W113 by default) and/or use the `scope-strict-mode` `_G` guard during development so this class of bug fails loudly and immediately instead of shipping silently.

## See Also

- [scope-local-by-default](scope-local-by-default.md)
- [scope-no-accidental-global](scope-no-accidental-global.md)
- [lint-luacheck-ci](lint-luacheck-ci.md)
