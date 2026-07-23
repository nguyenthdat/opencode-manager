# table-insert-append

> Append with `t[#t+1] = v` or `table.insert(t, v)` consistently

## Why It Matters

Both idioms append to a sequence, but they aren't always interchangeable in edge cases and mixing styles inconsistently in the same codebase hurts readability. `t[#t+1] = v` is a direct index write and is marginally faster in hot loops since it skips a function call; `table.insert(t, v)` is clearer at call sites and required when inserting at an arbitrary position.

## Bad

```lua
-- Inconsistent mixing of append styles in the same function
local function collect(items)
  local result = {}
  table.insert(result, items[1])
  result[#result + 1] = items[2]
  table.insert(result, 3, items[3])  -- inserting at position 3 (surprising)
  return result
end
```

## Good

```lua
-- Hot loop: direct index write avoids a function call per iteration
local function collect_fast(items)
  local result = {}
  local n = 0
  for _, item in ipairs(items) do
    n = n + 1
    result[n] = item
  end
  return result
end

-- Non-hot-path / clarity preferred: table.insert reads well
local function collect_clear(items)
  local result = {}
  for _, item in ipairs(items) do
    table.insert(result, item)
  end
  return result
end

-- Inserting at a specific position: always use table.insert(t, pos, v)
local queue = { "b", "c" }
table.insert(queue, 1, "a")  -- queue is now { "a", "b", "c" }
```

## See Also

- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [table-preallocate](table-preallocate.md)
- [table-remove-vs-nil](table-remove-vs-nil.md)
