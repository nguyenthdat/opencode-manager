# proj-src-lua-layout

> Use a conventional `lua/` source directory layout

## Why It Matters

Several parts of the Lua ecosystem (Neovim plugins in particular) expect source files under a top-level `lua/` directory, which is automatically added to `package.path` by the host — following this convention means your module works with zero manual `package.path` configuration on any host that already expects it.

## Bad

```
myplugin/
  src/
    init.lua       -- Neovim won't find this on its runtimepath-based
    utils.lua       -- package.path without extra configuration
```

## Good

```
myplugin.nvim/
  lua/
    myplugin/
      init.lua        -- require("myplugin")
      utils.lua        -- require("myplugin.utils")
      config.lua       -- require("myplugin.config")
  plugin/
    myplugin.lua       -- thin Vimscript/Lua bootstrap, loaded automatically
  doc/
    myplugin.txt       -- :help documentation
  README.md
```

```lua
-- lua/myplugin/init.lua
local M = {}
local utils = require("myplugin.utils")

function M.setup(opts)
  ...
end

return M
```

## General-Purpose (Non-Neovim) Projects

For a plain LuaRocks-distributed library with no specific host convention, a top-level `src/` or a flat layout is equally fine — the `lua/` convention specifically matters when targeting Neovim's runtimepath-based module discovery.

## See Also

- [proj-plugin-directory-layout](proj-plugin-directory-layout.md)
- [proj-require-path-convention](proj-require-path-convention.md)
- [embed-neovim-lazy-plugin](embed-neovim-lazy-plugin.md)
