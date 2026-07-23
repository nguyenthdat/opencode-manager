# table-remove-vs-nil

> Use `table.remove` to remove sequence elements, not manual `nil` assignment

## Why It Matters

Assigning `t[i] = nil` inside a sequence leaves a hole and shifts nothing — everything after index `i` is still there, but the sequence is now broken for `#`/`ipairs`. `table.remove(t, i)` shifts subsequent elements down by one, keeping the table a valid sequence.

## Bad

```lua
local tasks = { "build", "test", "deploy", "notify" }

-- Removing "test" this way leaves a hole, "deploy" and "notify" don't move
tasks[2] = nil
-- tasks is now { "build", nil, "deploy", "notify" } -- broken sequence
for i, v in ipairs(tasks) do print(i, v) end  -- stops after "build"
```

## Good

```lua
local tasks = { "build", "test", "deploy", "notify" }

-- table.remove shifts "deploy" and "notify" down, keeps it a sequence
table.remove(tasks, 2)
-- tasks is now { "build", "deploy", "notify" }
for i, v in ipairs(tasks) do print(i, v) end  -- all three, in order

-- Removing the last element is O(1) and needs no index argument
table.remove(tasks)  -- removes "notify"

-- If you need to remove many elements while iterating, iterate backwards
local queue = { "a", "b", "c", "d" }
for i = #queue, 1, -1 do
  if queue[i] == "b" or queue[i] == "c" then
    table.remove(queue, i)
  end
end
```

## When Not to Use table.remove

`table.remove` is O(n) because it shifts elements. For large sequences with frequent removals from the middle, consider a different data structure (a linked list emulated with tables, or a "swap with last element then pop" pattern when order doesn't matter):

```lua
-- Order-independent O(1) removal: swap-and-pop
local function swap_remove(t, i)
  t[i] = t[#t]
  t[#t] = nil
end
```

## See Also

- [table-no-holes](table-no-holes.md)
- [table-length-operator](table-length-operator.md)
- [table-insert-append](table-insert-append.md)
