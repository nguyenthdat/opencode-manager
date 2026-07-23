# api-avoid-side-effects-on-require

> Avoid side effects at module load time; `require` should be cheap and safe

## Why It Matters

`require` is expected to be idempotent, cheap, and side-effect-free beyond defining the module's exports — code that opens network connections, starts timers, or writes files just from being `require`d makes load order matter, breaks in test environments, and surprises anyone who merely wants to inspect a module's exports (e.g. tooling, documentation generators, or a REPL).

## Bad

```lua
-- database.lua -- side effects fire the instant this is require()'d,
-- even if the caller only wanted to read M.DEFAULT_TIMEOUT
local M = {}
M.DEFAULT_TIMEOUT = 30

M.connection = connect_to_database()  -- runs at require() time!
start_background_health_check()        -- also runs immediately, unconditionally

return M
```

## Good

```lua
-- database.lua -- purely defines exports; nothing runs until called explicitly
local M = {}
M.DEFAULT_TIMEOUT = 30

local connection

function M.connect()
  connection = connection or connect_to_database()
  return connection
end

function M.start_health_check()
  start_background_health_check()
end

return M
```

```lua
-- caller.lua -- side effects happen only when explicitly requested
local db = require("database")
db.connect()
db.start_health_check()
```

## Why This Matters More in Embedded/Long-Running Contexts

In Neovim, OpenResty, and game engines, modules are frequently `require`d speculatively (lazy-loaded plugins, hot-reloaded scripts) or multiple times across different worker processes — side effects at load time can fire redundantly, at the wrong time, or in the wrong worker.

## See Also

- [api-init-function](api-init-function.md)
- [api-singleton-vs-factory](api-singleton-vs-factory.md)
- [proj-avoid-circular-require](proj-avoid-circular-require.md)
