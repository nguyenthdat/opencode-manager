# lint-max-line-length

> Enforce a consistent maximum line length

## Why It Matters

Lua's flexible whitespace rules mean long lines accumulate easily (chained method calls, wide table literals, long string concatenations) without a limit forcing a wrap — an enforced max line length keeps diffs readable in side-by-side review and avoids horizontal scrolling in split editor panes, a common Lua/Neovim development setup.

## Bad

```lua
-- .luacheckrc: no max_line_length set, and stylua.toml missing too --
-- lines grow unchecked
local result = some_module.process(data, { timeout = config.timeout, retries = config.retries, verify_ssl = config.verify_ssl, callback = on_complete })
```

## Good

```lua
-- .luacheckrc
max_line_length = 120
```

```toml
# stylua.toml
column_width = 120
```

```lua
-- StyLua automatically wraps long calls once column_width is configured
local result = some_module.process(data, {
  timeout = config.timeout,
  retries = config.retries,
  verify_ssl = config.verify_ssl,
  callback = on_complete,
})
```

## Picking a Width

120 columns is a common modern choice (wide enough for descriptive names, narrow enough for side-by-side diffs); some Neovim-ecosystem projects use 100 to match common terminal/editor split widths — pick one value and set it consistently in both `luacheck` and `stylua` config so the linter and formatter agree.

## See Also

- [lint-stylua-format](lint-stylua-format.md)
- [lint-luacheckrc-config](lint-luacheckrc-config.md)
- [lint-editorconfig](lint-editorconfig.md)
