# api-singleton-vs-factory

> Choose singleton module state vs. factory-created instances deliberately

## Why It Matters

A `require`d module is cached and shared — every `require("mymodule")` call in the same Lua state returns the *same* table. That makes module-level state a natural singleton (fine for genuinely global things like a logger or a config store), but a trap if the module was meant to represent independent, per-caller instances (a database connection, a parser) that different parts of the program shouldn't share.

## Bad

```lua
-- connection.lua -- accidentally a singleton: every caller shares one socket
local M = { socket = nil }

function M.connect(host)
  M.socket = net.open(host)
end

function M.send(data)
  M.socket:send(data)
end

return M
```

```lua
-- Two unrelated parts of the app now silently share ONE connection:
local conn = require("connection")
conn.connect("service-a.internal")
-- ... elsewhere ...
local conn2 = require("connection")   -- same cached module table!
conn2.connect("service-b.internal")   -- overwrites the shared socket --
                                       -- conn's earlier connection is now broken
```

## Good

```lua
-- connection.lua -- factory pattern: each call produces an independent instance
local Connection = {}
Connection.__index = Connection

function Connection.new(host)
  return setmetatable({ socket = net.open(host) }, Connection)
end

function Connection:send(data)
  self.socket:send(data)
end

return Connection
```

```lua
local Connection = require("connection")
local conn_a = Connection.new("service-a.internal")
local conn_b = Connection.new("service-b.internal")  -- fully independent
```

## When Module-Level Singleton State Is the Right Choice

A logger, a metrics registry, or an application-wide config store are genuinely meant to be shared and are legitimate singletons — the key is making that choice on purpose, not by accident.

## See Also

- [meta-new-constructor](meta-new-constructor.md)
- [table-nested-ownership](table-nested-ownership.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
