# proj-rockspec-luarocks

> Provide a LuaRocks rockspec for distributable modules

## Why It Matters

LuaRocks is the de facto package manager for the Lua ecosystem; a rockspec file declares a module's name, version, dependencies, and build instructions so it can be installed with `luarocks install mymodule` and depended on by other rocks. Without one, consumers must manually vendor your source files and track dependencies themselves.

## Bad

```
mylib/
  mylib.lua
  README.md
-- no rockspec: no declared dependencies, no version, not installable via luarocks
```

## Good

```lua
-- mylib-1.0.0-1.rockspec
package = "mylib"
version = "1.0.0-1"

source = {
  url = "git+https://github.com/someuser/mylib.git",
  tag = "v1.0.0",
}

description = {
  summary = "A small library for validating phone numbers",
  license = "MIT",
  homepage = "https://github.com/someuser/mylib",
}

dependencies = {
  "lua >= 5.1",
  "penlight >= 1.13.0",
}

build = {
  type = "builtin",
  modules = {
    mylib = "mylib.lua",
    ["mylib.validators"] = "mylib/validators.lua",
  },
}
```

```sh
luarocks install mylib-1.0.0-1.rockspec  # local build/install
luarocks upload mylib-1.0.0-1.rockspec   # publish to luarocks.org
```

## Rockspec Version Suffix

The trailing `-1` in `1.0.0-1` is the rockspec *revision*, independent from the module's own version — bump it if you fix the rockspec itself (e.g. a build config error) without changing the module's actual code.

## See Also

- [api-version-field](api-version-field.md)
- [doc-readme-usage](doc-readme-usage.md)
- [proj-vendor-dependencies](proj-vendor-dependencies.md)
