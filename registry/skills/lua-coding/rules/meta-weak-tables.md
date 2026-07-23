# meta-weak-tables

> Use weak tables (`__mode`) for caches to avoid unbounded memory growth

## Why It Matters

A normal table holds strong references to its keys and values, so a cache keyed by object identity will keep every object alive forever, even after nothing else references it — a memory leak. Setting a table's `__mode` metafield to `"k"`, `"v"`, or `"kv"` tells the garbage collector it may reclaim entries whose key/value/both are otherwise unreachable, making the table suitable as a genuine cache.

## Bad

```lua
-- Every entity ever created stays in this cache forever, even after
-- the entity itself is destroyed and dropped everywhere else
local metadata_cache = {}

local function get_metadata(entity)
  if not metadata_cache[entity] then
    metadata_cache[entity] = compute_expensive_metadata(entity)
  end
  return metadata_cache[entity]
end
```

## Good

```lua
-- Weak-keyed table: once `entity` has no other references, the GC may
-- collect the entry, so the cache doesn't leak memory
local metadata_cache = setmetatable({}, { __mode = "k" })

local function get_metadata(entity)
  if not metadata_cache[entity] then
    metadata_cache[entity] = compute_expensive_metadata(entity)
  end
  return metadata_cache[entity]
end
```

## `__mode` Values

| Mode | Effect |
|---|---|
| `"k"` | Weak keys — entries collected when the *key* is otherwise unreachable |
| `"v"` | Weak values — entries collected when the *value* is otherwise unreachable |
| `"kv"` | Both weak — entries collected when either is otherwise unreachable |

## Caveat

Weak tables only help with garbage-collectable values (tables, functions, userdata, threads); numbers, booleans, and short strings interned by Lua are never actually collected as keys/values in the way you might expect, since Lua may intern small values.

## See Also

- [table-shallow-vs-deepcopy](table-shallow-vs-deepcopy.md)
- [perf-gc-tuning](perf-gc-tuning.md)
- [embed-game-engine-hot-reload](embed-game-engine-hot-reload.md)
