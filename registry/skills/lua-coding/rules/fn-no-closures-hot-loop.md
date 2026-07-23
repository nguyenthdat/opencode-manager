# fn-no-closures-hot-loop

> Avoid creating closures inside hot loops

## Why It Matters

Every closure allocates a function object (and, if it captures upvalues, a small upvalue structure) at the point it's created. Creating a fresh closure on every iteration of a loop that runs thousands or millions of times (a game's per-frame update, a request handler processing a large batch) adds allocation and garbage-collection pressure that a loop without closures wouldn't have.

## Bad

```lua
-- A new closure is allocated on every single iteration
local function process_all(items)
  local results = {}
  for i, item in ipairs(items) do
    table.sort(item.children, function(a, b) return a.priority < b.priority end)
    results[i] = item
  end
  return results
end
```

## Good

```lua
-- Hoist the closure out of the loop -- allocated once, reused every iteration
local function by_priority(a, b) return a.priority < b.priority end

local function process_all(items)
  local results = {}
  for i, item in ipairs(items) do
    table.sort(item.children, by_priority)
    results[i] = item
  end
  return results
end

-- If the "closure" genuinely needs per-iteration data, pass it as an
-- argument instead of capturing it, so the function itself can be hoisted
local function scaled_compare(scale)
  return function(a, b) return a.value * scale < b.value * scale end
end
-- Bad: called inside the loop, allocates each time --
--   table.sort(list, scaled_compare(current_scale))
-- Better: hoist once per distinct scale value needed, outside the hot loop
local compare = scaled_compare(2.0)
for _, list in ipairs(all_lists) do
  table.sort(list, compare)
end
```

## When It's Fine

For code that runs rarely (startup, config loading, one-off batch scripts), the allocation cost of a per-iteration closure is negligible — don't contort the code for this unless profiling shows it matters.

## See Also

- [scope-closure-capture](scope-closure-capture.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [perf-profile-first](perf-profile-first.md)
