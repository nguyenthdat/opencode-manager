# api-no-monkey-patching

> Don't monkey-patch the global/standard library tables

## Why It Matters

Overwriting or adding methods to `string`, `table`, `_G`, or other shared global tables affects every other piece of code in the process, including third-party libraries that don't expect the change — a classic source of "impossible" bugs that only reproduce when two unrelated modules happen to both patch the same table. In shared runtimes (Neovim, OpenResty workers, a game engine's scripting VM) this can break plugins/modules you don't even control.

## Bad

```lua
-- "Helpfully" adding a method to the shared string table
function string.trim(s)
  return s:match("^%s*(.-)%s*$")
end

-- Now every string value in the entire process has `:trim()` -- including
-- inside third-party libraries loaded later that might define their OWN
-- incompatible string.trim, silently overwriting yours (or vice versa)
print(("  hi  "):trim())
```

## Good

```lua
-- stringutils.lua -- a normal module, no shared state touched
local M = {}

function M.trim(s)
  return s:match("^%s*(.-)%s*$")
end

return M
```

```lua
local strutil = require("stringutils")
print(strutil.trim("  hi  "))
```

## When Extending a Global Table Is Accepted Practice

Some embeddings *do* have a sanctioned extension point (e.g. Neovim plugins adding fields under their own namespaced `vim.g.my_plugin` or a dedicated `vim.my_plugin` table they own) — the key distinction is whether you own the table being extended, not whether extension is technically possible.

## See Also

- [scope-module-pattern](scope-module-pattern.md)
- [anti-global-state-mutation](anti-global-state-mutation.md)
- [embed-neovim-vim-api](embed-neovim-vim-api.md)
