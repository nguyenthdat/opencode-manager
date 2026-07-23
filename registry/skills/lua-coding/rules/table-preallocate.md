# table-preallocate

> Preallocate tables when the final size is known, to avoid rehashing

## Why It Matters

Lua tables grow by reallocating and rehashing their internal array/hash parts as they cross size thresholds. Building a large table one element at a time forces repeated reallocation and copying. When you know the size ahead of time, preallocate to avoid that churn — the standard library exposes this only indirectly, but LuaJIT and some vanilla-Lua builds provide `table.new`.

## Bad

```lua
-- Grows the table one insertion at a time; repeated rehashing under the hood
local function build_results(n)
  local results = {}
  for i = 1, n do
    results[i] = expensive(i)
  end
  return results
end
```

## Good

```lua
-- LuaJIT extension: preallocate array slots (narr) and hash slots (nrec)
local new_tab = require("table.new")  -- ships with LuaJIT's table library

local function build_results(n)
  local results = new_tab(n, 0)  -- n array slots, 0 hash slots
  for i = 1, n do
    results[i] = expensive(i)
  end
  return results
end

-- Vanilla Lua 5.1-5.4 has no public preallocation API; the practical
-- mitigation is to avoid repeated growth patterns and build sequentially
-- from index 1 without holes, which the VM handles reasonably well:
local function build_results_plain(n)
  local results = {}
  for i = 1, n do
    results[i] = expensive(i)  -- sequential 1..n growth is the cheap path
  end
  return results
end
```

## When Preallocation Doesn't Matter

For small, one-off tables (a handful of elements) or code that isn't on a hot path, preallocation is not worth the added dependency or complexity. Reach for `table.new` only once profiling shows table growth/rehashing as a bottleneck (e.g. building large result sets every frame in a game loop).

## See Also

- [perf-luajit-table-new](perf-luajit-table-new.md)
- [table-array-vs-dict](table-array-vs-dict.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
