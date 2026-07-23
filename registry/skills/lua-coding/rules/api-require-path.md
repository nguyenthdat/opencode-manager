# api-require-path

> Design clean, predictable `require()` paths and module names

## Why It Matters

`require("a.b.c")` maps to a file path via `package.path` (roughly `a/b/c.lua` or `a/b/c/init.lua`), so the module name a caller writes and the file layout on disk are directly linked. Sloppy or inconsistent naming (mixed dots/underscores, deeply nested single-file modules, ambiguous top-level names) makes modules hard to find and easy to misname.

## Bad

```
lib/
  StringUtils.lua        -- inconsistent casing vs. the rest of the project
  http_client.lua
  db/
    Connection.lua
    query_builder.lua    -- mixed naming conventions in the same directory
```

```lua
local http = require("http_client")      -- fine
local StrUtil = require("StringUtils")   -- inconsistent with the rest
```

## Good

```
lib/
  stringutils.lua
  http_client.lua
  db/
    init.lua              -- require("db") loads this
    connection.lua         -- require("db.connection")
    query_builder.lua      -- require("db.query_builder")
```

```lua
local strutil = require("lib.stringutils")
local http = require("lib.http_client")
local db = require("lib.db")
local conn = require("lib.db.connection")
```

## Consistent Casing and Separators

Pick lowercase, underscore-separated module file names project-wide (matching most Lua ecosystem conventions — LuaRocks, OpenResty, Neovim runtime files are virtually all lowercase), and mirror the directory structure exactly in dotted `require` paths.

## See Also

- [proj-require-path-convention](proj-require-path-convention.md)
- [proj-init-lua-entry](proj-init-lua-entry.md)
- [name-module-lowercase](name-module-lowercase.md)
