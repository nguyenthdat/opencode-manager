# lint-editorconfig

> Use an `.editorconfig` for indentation/whitespace consistency across editors

## Why It Matters

Not every contributor uses an editor that respects your `stylua.toml`/`luacheckrc` settings automatically (or has the StyLua plugin installed) — `.editorconfig` is a widely supported, tool-agnostic standard that most editors (VS Code, Neovim with a plugin, JetBrains IDEs) honor out of the box for basic indentation and whitespace, catching the simplest inconsistencies before a formatter even runs.

## Bad

```lua
-- Mixed tabs and spaces across files, because no .editorconfig exists and
-- different contributors' editors default differently
function foo()
	return 1  -- tab-indented
end

function bar()
    return 2  -- space-indented, different file, same project
end
```

## Good

```ini
# .editorconfig
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.lua]
indent_style = space
indent_size = 2
```

## Complementary, Not a Replacement

`.editorconfig` handles the baseline (indentation style/size, line endings, trailing whitespace) across any editor; `StyLua` still does the heavier, Lua-aware formatting (quote style, call parentheses, table alignment) — configure both, and keep their indentation settings in agreement.

## See Also

- [lint-stylua-format](lint-stylua-format.md)
- [lint-max-line-length](lint-max-line-length.md)
- [lint-luacheckrc-config](lint-luacheckrc-config.md)
