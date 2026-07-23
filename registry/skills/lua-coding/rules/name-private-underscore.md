# name-private-underscore

> Use a leading underscore to signal "private by convention" fields/functions

## Why It Matters

Lua has no access modifiers, so a leading underscore (`_socket`, `_internal_helper`) is the community-recognized way to say "this is an implementation detail, don't depend on it from outside," even though nothing technically prevents access. It sets expectations for code reviewers and future maintainers.

## Bad

```lua
local Connection = {}
Connection.__index = Connection

function Connection.new(host)
  -- no signal that `socket` and `retry_count` aren't meant to be touched directly
  return setmetatable({ host = host, socket = nil, retry_count = 0 }, Connection)
end

-- Nothing discourages external code from doing this:
conn.retry_count = -999   -- reaches into "private" state with no warning sign
```

## Good

```lua
local Connection = {}
Connection.__index = Connection

function Connection.new(host)
  return setmetatable({ host = host, _socket = nil, _retry_count = 0 }, Connection)
end

function Connection:is_connected()
  return self._socket ~= nil
end

-- The underscore signals intent clearly, even though Lua can't enforce it:
-- conn._retry_count = -999   -- a reviewer should flag this as reaching into internals
```

## Underscore for "Intentionally Unused" Too

The same leading-underscore convention (often a bare `_`) is also used for intentionally unused loop variables or discarded return values:

```lua
for _, value in ipairs(list) do    -- index intentionally unused
  process(value)
end

local _, err = risky_call()        -- first return value intentionally discarded
```

## See Also

- [api-public-private-fields](api-public-private-fields.md)
- [name-loop-vars](name-loop-vars.md)
- [scope-module-pattern](scope-module-pattern.md)
