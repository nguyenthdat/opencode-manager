# embed-neovim-lazy-plugin

> Follow lazy.nvim/plugin-spec conventions for Neovim plugins

## Why It Matters

The dominant Neovim plugin manager (`lazy.nvim`, successor to `packer.nvim`) expects plugins to expose a predictable `setup(opts)` entry point and to declare lazy-loading triggers (commands, events, filetypes, keys) in a plugin spec table — deviating from this shape makes a plugin harder to install and configure the way the ecosystem expects, and defeats lazy-loading if the plugin does work at require-time instead of inside `setup`.

## Bad

```lua
-- plugin does work immediately on require(), defeating lazy-loading and
-- offering no configurable setup() entry point
local M = {}
M.config = { greeting = "hello" }
print(M.config.greeting)  -- side effect fires the instant the plugin loads

return M
```

## Good

```lua
-- lua/myplugin/init.lua
local M = {
  config = { greeting = "hello" },
}

function M.setup(opts)
  M.config = vim.tbl_deep_extend("force", M.config, opts or {})
end

function M.greet()
  print(M.config.greeting)
end

return M
```

```lua
-- User's lazy.nvim spec (in their own config, not part of the plugin itself)
return {
  "someuser/myplugin.nvim",
  event = "VeryLazy",              -- lazy-load trigger: don't load at startup
  opts = { greeting = "hi there" }, -- lazy.nvim calls setup(opts) automatically
}
```

## Why `opts` (not a Manual `config` Function) Is Preferred

`lazy.nvim`'s `opts` field automatically calls `require("myplugin").setup(opts)` for you — supporting this convention (rather than requiring users to write a custom `config = function() ... end`) is what most users expect from a well-behaved plugin.

## See Also

- [api-init-function](api-init-function.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
- [proj-plugin-directory-layout](proj-plugin-directory-layout.md)
