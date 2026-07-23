# proj-require-path-convention

> Follow `?.lua` / `?/init.lua` `require` path conventions

## Why It Matters

`require("a.b")` resolves against `package.path` templates like `./?.lua;./?/init.lua;...`, substituting `.` with the OS path separator and trying each template in order. Understanding this precisely (rather than guessing) explains why `require("mymodule")` sometimes finds `mymodule.lua` and sometimes `mymodule/init.lua`, and lets you structure a project so both single-file and directory-based modules resolve exactly as intended.

## Bad

```
lib/
  db.lua           -- require("lib.db") finds this: fine
  db/
    connection.lua -- but ALSO having lib/db/ as a directory is ambiguous/confusing
                     -- alongside a lib/db.lua file with the same stem
```

```lua
local db = require("lib.db")           -- which one does this resolve to first?
local conn = require("lib.db.connection")  -- only works if lib/db.lua does NOT
                                             -- also exist and shadow the directory
```

## Good

```
lib/
  db/
    init.lua         -- require("lib.db") -> lib/db/init.lua
    connection.lua   -- require("lib.db.connection") -> lib/db/connection.lua
    query_builder.lua
```

```lua
local db = require("lib.db")                 -- loads lib/db/init.lua
local conn = require("lib.db.connection")     -- loads lib/db/connection.lua
```

## Checking `package.path`

```lua
print(package.path)
-- e.g. "./?.lua;./?/init.lua;/usr/local/share/lua/5.4/?.lua;..."
```

If your project needs a non-standard root (a `lib/` or `src/` directory not on the default path), prepend it explicitly at startup:

```lua
package.path = "./lib/?.lua;./lib/?/init.lua;" .. package.path
```

## See Also

- [proj-init-lua-entry](proj-init-lua-entry.md)
- [api-require-path](api-require-path.md)
- [proj-src-lua-layout](proj-src-lua-layout.md)
