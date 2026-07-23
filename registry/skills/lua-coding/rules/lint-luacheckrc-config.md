# lint-luacheckrc-config

> Configure a project `.luacheckrc` with the correct globals/std

## Why It Matters

`luacheck` needs to know which Lua standard (`std`) and which embedding-specific globals (`vim`, `ngx`, `love`, `redis`) are legitimate before it can distinguish "accidental global" bugs from intentional use of the host's API — without a `.luacheckrc`, it either misses real bugs (defaulting too permissive) or floods you with false positives on every legitimate host-global reference.

## Bad

```
-- no .luacheckrc at all -- luacheck assumes plain Lua 5.1 stdlib globals only
$ luacheck .
lua/myplugin/init.lua:12:3: accessing undefined variable 'vim'
lua/myplugin/init.lua:15:5: accessing undefined variable 'vim'
-- hundreds of false positives for every vim.* reference in a Neovim plugin
```

## Good

```lua
-- .luacheckrc (Neovim plugin project)
std = "lua51+busted"          -- Neovim's LuaJIT is 5.1-based; include busted for tests
globals = { "vim" }            -- the Neovim-provided global
read_globals = { "jit" }       -- LuaJIT's read-only global

exclude_files = {
  "vendor/**",
}

max_line_length = 120
```

```lua
-- .luacheckrc (OpenResty project)
std = "ngx_lua"    -- luacheck ships a built-in std profile for lua-nginx-module
globals = { "ndk" }
```

```sh
luacheck .   -- now correctly recognizes vim.*/ngx.* as legitimate, not undefined
```

## Standard `std` Values Worth Knowing

`lua51`, `lua52`, `lua53`, `lua54`, `luajit`, `ngx_lua` (OpenResty), `min` (a minimal, restrictive baseline) — combine with `+busted`/`+love` etc. to layer in test-framework or engine-specific globals.

## See Also

- [lint-globals-allowlist](lint-globals-allowlist.md)
- [lint-luacheck-ci](lint-luacheck-ci.md)
- [scope-no-accidental-global](scope-no-accidental-global.md)
