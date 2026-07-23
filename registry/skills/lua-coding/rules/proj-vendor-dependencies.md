# proj-vendor-dependencies

> Vendor or lock third-party pure-Lua dependencies deliberately

## Why It Matters

Many Lua embedding contexts (game engines, Neovim plugins, Redis scripts) don't have LuaRocks available at runtime at all — the only practical way to depend on a third-party pure-Lua library is to vendor its source directly into your project. Doing this without a clear process (which version, where it lives, how to update it) leads to silently outdated or unpatched copies scattered across a codebase.

## Bad

```
myplugin/
  lua/
    myplugin/
      init.lua
      json.lua      -- copied from somewhere, no record of which version,
                      -- no way to tell if it has a known bug fixed upstream
```

## Good

```
myplugin/
  lua/
    myplugin/
      init.lua
  vendor/
    json.lua/          -- vendored dependency, isolated from your own code
      json.lua
      LICENSE
      VERSION            -- records exactly which upstream version/commit this is
```

```lua
-- lua/myplugin/init.lua
package.path = package.path .. ";" .. vendor_path .. "/?.lua"
local json = require("json")
```

```
# vendor/json.lua/VERSION
rxi/json.lua @ commit a4f6ca3, vendored 2026-01-15
```

## A Small Vendoring Checklist

Record the exact upstream source (repo + commit/tag), keep the upstream `LICENSE` file alongside the vendored code, isolate it in its own directory so it's obviously not your own code, and note the vendor date/version so a future update is a deliberate, trackable decision rather than a guess.

## See Also

- [proj-rockspec-luarocks](proj-rockspec-luarocks.md)
- [doc-changelog](doc-changelog.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
