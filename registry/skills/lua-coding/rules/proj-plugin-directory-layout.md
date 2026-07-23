# proj-plugin-directory-layout

> Follow the `plugin/`/`ftplugin/`/`lua/` directory layout for Neovim plugins

## Why It Matters

Neovim (and historically Vim) auto-loads specific directories from every plugin on the `runtimepath` according to a fixed convention: `plugin/*.lua` (auto-sourced at startup), `ftplugin/*.lua` (loaded for a specific filetype), `lua/` (available via `require`, not auto-loaded), `doc/*.txt` (for `:help`). Placing files in the wrong location means they either never load, or load at the wrong time.

## Bad

```
myplugin/
  init.lua            -- Neovim has no convention for a bare top-level init.lua;
                        -- this simply never gets loaded automatically
  commands.lua         -- same problem
```

## Good

```
myplugin.nvim/
  plugin/
    myplugin.lua        -- auto-sourced once at Neovim startup (thin bootstrap only)
  lua/
    myplugin/
      init.lua           -- require("myplugin") -- the actual implementation
      commands.lua
  ftplugin/
    python.lua           -- auto-sourced only when editing a Python buffer
  doc/
    myplugin.txt          -- :help myplugin
```

```lua
-- plugin/myplugin.lua -- kept minimal; defers real work to lua/myplugin/init.lua
if vim.g.loaded_myplugin then return end
vim.g.loaded_myplugin = true

vim.api.nvim_create_user_command("MyPlugin", function()
  require("myplugin").run()
end, {})
```

## Guard Against Double-Loading

The `if vim.g.loaded_myplugin then return end` guard at the top of `plugin/*.lua` prevents re-running setup if the plugin manager sources the file more than once (common with lazy-loading plugin managers).

## See Also

- [proj-src-lua-layout](proj-src-lua-layout.md)
- [embed-neovim-lazy-plugin](embed-neovim-lazy-plugin.md)
- [embed-neovim-vim-api](embed-neovim-vim-api.md)
