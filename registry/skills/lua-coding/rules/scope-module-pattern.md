# scope-module-pattern

> Use the module-table-return pattern; never pollute `_G`

## Why It Matters

Lua's `require` protocol expects a file to return a value (conventionally a table) that callers bind to a local name. Writing directly to `_G` from a module (the deprecated Lua 5.1 `module()` function, or manually assigning globals) makes every symbol visible everywhere, collides across unrelated modules, and makes dependencies implicit and untrackable.

## Bad

```lua
-- mymodule.lua -- pollutes the global namespace
function greet(name)
  return "Hello, " .. name
end

VERSION = "1.0.0"

-- Anyone anywhere can now call greet() or read VERSION without require()ing
-- this file, and any other module defining `greet` silently overwrites it.
```

## Good

```lua
-- mymodule.lua
local M = {}

M.VERSION = "1.0.0"

function M.greet(name)
  return "Hello, " .. name
end

return M
```

```lua
-- caller.lua
local mymodule = require("mymodule")
print(mymodule.greet("World"))
print(mymodule.VERSION)
```

## See Also

- [api-module-return-table](api-module-return-table.md)
- [scope-local-by-default](scope-local-by-default.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
