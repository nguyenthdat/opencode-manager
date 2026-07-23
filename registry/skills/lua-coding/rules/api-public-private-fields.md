# api-public-private-fields

> Distinguish public API fields from private implementation details

## Why It Matters

Lua has no visibility modifiers (`private`/`public` keywords), so a module's real public surface has to be communicated by convention. Without a clear signal, callers reach into "implementation detail" fields directly, and any later refactor of those fields becomes a breaking change even though it was never meant to be part of the contract.

## Bad

```lua
local M = {}

M.cache = {}          -- is this public? private? unclear
M._internal_state = 0 -- unclear whether the underscore convention is even followed

function M.process(x)
  M._internal_state = M._internal_state + 1
  return M.cache[x] or compute(x)
end

return M
```

## Good

```lua
local M = {}

-- Private state: module-local upvariable, never exposed on M at all
local cache = {}
local internal_state = 0

-- Public API: only these fields/functions are the supported contract
function M.process(x)
  internal_state = internal_state + 1
  return cache[x] or compute(x)
end

function M.stats()
  return { calls = internal_state }
end

return M
```

## When State Must Live on the Table (e.g. Instances)

For per-instance (metatable-based) objects, use a leading underscore to signal "don't touch this directly, even though Lua can't stop you":

```lua
local Connection = {}
Connection.__index = Connection

function Connection.new(host)
  return setmetatable({ host = host, _socket = nil, _retry_count = 0 }, Connection)
  -- `_socket`/`_retry_count`: private by convention; `host`: public field
end
```

## See Also

- [name-private-underscore](name-private-underscore.md)
- [scope-module-pattern](scope-module-pattern.md)
- [api-init-function](api-init-function.md)
