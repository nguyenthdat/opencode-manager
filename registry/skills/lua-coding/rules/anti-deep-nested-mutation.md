# anti-deep-nested-mutation

> Anti-pattern: deeply nested table mutation without clear ownership

## Why It Matters

Reaching several levels into a nested table structure to mutate a deeply buried field (`config.server.limits.connections.max = 100`) from far-away code makes it nearly impossible to know, by reading any one place, everywhere that structure can be changed — this is exactly the "spooky action at a distance" that dedicated setter functions and clear ownership boundaries exist to prevent.

## Bad

```lua
-- Code scattered across the codebase reaches directly into deep structure
-- server_setup.lua
config.server.limits.connections.max = 100

-- rate_limiter.lua, elsewhere entirely
config.server.limits.connections.max = config.server.limits.connections.max - 10

-- Nobody can tell, from either file alone, the full history of mutations
-- to this one deeply nested field
```

## Good

```lua
-- config.lua -- owns the structure and exposes controlled mutation
local M = { server = { limits = { connections = { max = 100 } } } }

function M.set_max_connections(n)
  assert(type(n) == "number" and n > 0, "max connections must be positive")
  M.server.limits.connections.max = n
end

function M.reserve_connections(n)
  M.server.limits.connections.max = M.server.limits.connections.max - n
end

return M
```

```lua
-- server_setup.lua
local config = require("config")
config.set_max_connections(100)

-- rate_limiter.lua
local config = require("config")
config.reserve_connections(10)
-- All mutation now flows through one owning module's explicit API
```

## See Also

- [table-nested-ownership](table-nested-ownership.md)
- [anti-global-state-mutation](anti-global-state-mutation.md)
- [api-public-private-fields](api-public-private-fields.md)
