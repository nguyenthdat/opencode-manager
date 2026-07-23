# api-version-field

> Expose a `_VERSION` or `M.version` field for library modules

## Why It Matters

`require`d modules can be years old by the time a bug report comes in, and consumers (and you, six months later) need a fast way to check which version is actually loaded — especially in embedding contexts where multiple copies of a library can end up on `package.path` (vendored plus system-installed, for instance). Lua itself exposes `_VERSION` as the convention to follow.

## Bad

```lua
-- mylib.lua -- no way to tell which version is loaded without reading source
local M = {}
function M.parse(s) ... end
return M
```

## Good

```lua
-- mylib.lua
local M = {
  _VERSION = "2.3.1",       -- follows Lua's own `_VERSION` convention
}

function M.parse(s) ... end

return M
```

```lua
local mylib = require("mylib")
print(mylib._VERSION)   -- "2.3.1"
assert(mylib._VERSION >= "2.0.0", "mylib 2.0+ required")
```

## Aligning With LuaRocks

If the module is packaged as a LuaRocks rock, keep `_VERSION` in sync with the rockspec's `version` field so `luarocks show mylib` and `mylib._VERSION` never disagree:

```lua
-- mylib-2.3.1-1.rockspec
package = "mylib"
version = "2.3.1-1"
```

## See Also

- [proj-rockspec-luarocks](proj-rockspec-luarocks.md)
- [doc-changelog](doc-changelog.md)
- [api-backward-compat-field](api-backward-compat-field.md)
