# table-sort-comparator

> Provide a strict-weak-order comparator to `table.sort`

## Why It Matters

`table.sort` uses an unstable, implementation-defined sort algorithm (typically quicksort) that assumes the comparator defines a strict weak ordering. A comparator that returns `true` for `cmp(a, b)` and also `true` for `cmp(b, a)` (e.g. using `<=` instead of `<`) violates that contract and can crash with "invalid order function for sorting" or silently produce a wrongly-sorted table.

## Bad

```lua
local people = { {name="Bo", age=30}, {name="Al", age=30}, {name="Cy", age=25} }

-- Using <= makes cmp(a, b) and cmp(b, a) both true when ages are equal --
-- this violates strict weak ordering and can error or misbehave
table.sort(people, function(a, b) return a.age <= b.age end)
```

## Good

```lua
local people = { {name="Bo", age=30}, {name="Al", age=30}, {name="Cy", age=25} }

-- Strict less-than: equal elements return false in both directions
table.sort(people, function(a, b) return a.age < b.age end)

-- Multi-key sort: fall back to a secondary strict comparison on ties
table.sort(people, function(a, b)
  if a.age ~= b.age then
    return a.age < b.age
  end
  return a.name < b.name
end)

-- Sorting plain numbers/strings: the default comparator (no function) is
-- already a strict weak order, just omit the comparator
local nums = { 5, 3, 8, 1 }
table.sort(nums)
```

## See Also

- [fn-closures-encapsulate-state](fn-closures-encapsulate-state.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [table-array-vs-dict](table-array-vs-dict.md)
