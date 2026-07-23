# lint-stylua-format

> Use StyLua for consistent, automatic formatting

## Why It Matters

Without an enforced formatter, Lua's flexible syntax (optional parentheses on single-string/table-literal calls, inconsistent indentation of multi-line tables, varying quote styles) leads to formatting bikeshedding in every code review. `StyLua` is the dominant, opinionated Lua formatter (written in Rust, extremely fast) with wide adoption across Neovim plugins and general Lua projects.

## Bad

```lua
-- Inconsistent quote styles, spacing, and table formatting across the file
local M={}
function M.create(name,opts)
opts=opts or {}
	return {name=name,timeout=opts.timeout or 30,retries = opts.retries or 3}
end
return M
```

## Good

```toml
# stylua.toml
column_width = 120
line_endings = "Unix"
indent_type = "Spaces"
indent_width = 2
quote_style = "AutoPreferDouble"
call_parentheses = "Always"
```

```lua
-- After `stylua .`
local M = {}

function M.create(name, opts)
  opts = opts or {}
  return {
    name = name,
    timeout = opts.timeout or 30,
    retries = opts.retries or 3,
  }
end

return M
```

```sh
stylua .              # format everything in place
stylua --check .      # CI mode: fail if anything is not already formatted
```

## See Also

- [lint-luacheck-ci](lint-luacheck-ci.md)
- [lint-editorconfig](lint-editorconfig.md)
- [lint-max-line-length](lint-max-line-length.md)
