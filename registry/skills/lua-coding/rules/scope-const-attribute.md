# scope-const-attribute

> Use the `<const>` attribute (Lua 5.4+) for compile-time-checked immutability

## Why It Matters

Lua 5.4 added variable attributes. `local x <const> = v` makes the compiler reject any later assignment to `x` — a real compile-time guarantee, unlike a comment saying "don't change this". It documents intent and catches accidental reassignment before the code ever runs. It does **not** freeze the value itself if `x` is a table (mutating fields is still allowed).

## Bad

```lua
-- Lua 5.4, but no attribute -- nothing stops a later accidental reassignment
local max_retries = 3
-- ... 40 lines later, in a refactor ...
max_retries = compute_retries()  -- silently overwrites the "constant"
```

## Good

```lua
-- Lua 5.4: the compiler rejects any later assignment to max_retries
local max_retries <const> = 3
-- max_retries = 5   -- would be a compile-time error: "attempt to assign to const variable"

-- Remember: <const> only fixes the variable binding, not table contents
local config <const> = { retries = 3 }
config.retries = 5      -- still allowed -- the table itself is mutable
-- config = {}         -- this line WOULD be a compile-time error
```

## Version Note

`<const>` is Lua 5.4 only. On 5.1-5.3 or LuaJIT (which targets the 5.1 language plus extensions), there is no attribute syntax; convey intent with a naming convention (`SCREAMING_SNAKE_CASE`) and rely on code review/linting instead.

## See Also

- [scope-close-attribute](scope-close-attribute.md)
- [table-readonly-proxy](table-readonly-proxy.md)
- [name-screaming-constants](name-screaming-constants.md)
