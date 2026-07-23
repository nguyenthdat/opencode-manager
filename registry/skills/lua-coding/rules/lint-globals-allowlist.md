# lint-globals-allowlist

> Explicitly allowlist known embedding globals (`vim`, `ngx`, `love`, ...)

## Why It Matters

Every embedding host injects its own set of globals that are entirely legitimate to use but that a linter has no way to know about without being told — declaring them explicitly in `.luacheckrc` distinguishes "this is the host's documented API" from "this is an accidental global leak," which is exactly the distinction `luacheck` exists to make.

## Bad

```lua
-- .luacheckrc -- no globals declared at all for a Neovim plugin project
std = "lua51"
```

```
$ luacheck .
lua/myplugin/init.lua:8:3: accessing undefined variable 'vim'
-- luacheck can't tell this apart from a genuine typo/leaked global
```

## Good

```lua
-- .luacheckrc (Neovim plugin)
std = "lua51"
globals = { "vim" }

-- .luacheckrc (LÖVE game)
std = "lua51"
globals = { "love" }

-- .luacheckrc (OpenResty module, if not using the built-in ngx_lua std)
std = "lua51"
globals = { "ngx", "ndk" }
read_globals = { "ngx" }  -- if you want to forbid REASSIGNING ngx itself,
                           -- use read_globals instead of globals
```

## `globals` vs. `read_globals`

Use `read_globals` (not `globals`) for host-provided tables that should never be *reassigned*, only read/called — this catches the specific bug of accidentally writing `vim = something` instead of `vim.something = ...`, which `globals` alone would silently allow.

## See Also

- [lint-luacheckrc-config](lint-luacheckrc-config.md)
- [api-no-monkey-patching](api-no-monkey-patching.md)
- [scope-no-accidental-global](scope-no-accidental-global.md)
