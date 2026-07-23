# proj-init-lua-entry

> Use `init.lua` as the package/module entry point for directory-based modules

## Why It Matters

`require("a.b")` looks for `a/b/init.lua` after `a/b.lua` fails to match — using `init.lua` as the canonical entry point for a directory-based module is the standard, recognized pattern across the Lua ecosystem for a multi-file module that should still be `require`d as a single name.

## Bad

```
lib/
  http/
    main.lua    -- non-standard name; require("lib.http") won't find this at all
    client.lua
```

```lua
-- Forces callers to require the internal file directly, which is fragile
-- and exposes internal file layout as part of the public API
local http = require("lib.http.main")
```

## Good

```
lib/
  http/
    init.lua       -- require("lib.http") -> lib/http/init.lua
    client.lua      -- internal detail, required by init.lua itself
    server.lua       -- internal detail, required by init.lua itself
```

```lua
-- lib/http/init.lua
local client = require("lib.http.client")
local server = require("lib.http.server")

return {
  client = client,
  server = server,
}
```

```lua
-- caller.lua -- clean, single require, internal layout is an implementation detail
local http = require("lib.http")
http.client.get("https://example.com")
```

## See Also

- [proj-require-path-convention](proj-require-path-convention.md)
- [proj-src-lua-layout](proj-src-lua-layout.md)
- [api-module-return-table](api-module-return-table.md)
