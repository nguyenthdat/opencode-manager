# embed-neovim-vim-api

> Use Neovim's `vim.*` API and `vim.uv` conventions correctly

## Why It Matters

Neovim embeds LuaJIT and exposes a large, Neovim-specific `vim` global (editor commands, options, autocmds, an async event loop via `vim.uv`, formerly `vim.loop`) that doesn't exist in any other Lua embedding. Writing plugin code as if it were generic Lua (bypassing `vim.api`/`vim.fn` for things Neovim already provides) reinvents functionality Neovim already exposes, and often breaks on Neovim's actual event loop model.

## Bad

```lua
-- Trying to read a file synchronously with plain io.* inside a plugin,
-- which blocks Neovim's single UI thread during the read
local function read_config()
  local f = io.open(vim.fn.stdpath("config") .. "/settings.json", "r")
  local content = f:read("*a")
  f:close()
  return vim.json.decode(content)
end
```

## Good

```lua
-- Use vim.uv (Neovim's libuv binding) for non-blocking file I/O, and the
-- vim.* helpers that already know Neovim's paths/conventions
local uv = vim.uv or vim.loop  -- vim.uv is the modern name; vim.loop is the older alias

local function read_config(callback)
  local path = vim.fn.stdpath("config") .. "/settings.json"
  uv.fs_open(path, "r", 438, function(err, fd)
    if err then return callback(nil, err) end
    -- ... read via uv.fs_fstat / uv.fs_read, then uv.fs_close ...
  end)
end

-- Idiomatic Neovim plugin setup entry point
local M = {}
function M.setup(opts)
  opts = opts or {}
  vim.api.nvim_create_user_command("MyPluginRun", function()
    M.run(opts)
  end, {})
end

return M
```

## Key Neovim-Specific Namespaces

`vim.api` (low-level editor API), `vim.fn` (calls legacy Vimscript functions), `vim.opt`/`vim.o` (options), `vim.keymap.set` (keybindings), `vim.uv`/`vim.loop` (async I/O), `vim.json`/`vim.fn.json_encode` (JSON), `vim.notify` (user-facing messages).

## See Also

- [embed-neovim-lazy-plugin](embed-neovim-lazy-plugin.md)
- [coro-async-callback-bridge](coro-async-callback-bridge.md)
- [proj-plugin-directory-layout](proj-plugin-directory-layout.md)
