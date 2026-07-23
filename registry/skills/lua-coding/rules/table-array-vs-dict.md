# table-array-vs-dict

> Keep the array part and the hash part of a table conceptually separate

## Why It Matters

Lua has exactly one data structure — the table — that serves as both array and dictionary. The VM tracks an internal "array part" (contiguous integer keys starting at 1) separately from the "hash part" (everything else) for performance. Mixing sequence usage and map usage in the same table defeats this optimization, confuses `#`/`ipairs`, and makes the table's shape hard to reason about.

## Bad

```lua
-- Mixing array entries and named keys in one table with no clear intent
local config = {
  "first",
  "second",
  name = "worker",
  [10] = "sparse entry",
  "third",
}

-- Now # and ipairs behave unpredictably because the "sequence" has
-- non-contiguous integer keys mixed with string keys.
print(#config)          -- undefined-ish: 3 or something else, not reliable
for i, v in ipairs(config) do print(i, v) end  -- stops early, unclear
```

## Good

```lua
-- Array-part table: only used as a sequence
local names = { "first", "second", "third" }
for i, v in ipairs(names) do
  print(i, v)
end

-- Hash-part table: only used as a map, never relies on #
local config = {
  name = "worker",
  retries = 10,
  active = true,
}
for k, v in pairs(config) do
  print(k, v)
end

-- If you need both, use two separate tables or two named fields
local job = {
  args = { "first", "second", "third" },  -- sequence
  options = { name = "worker", retries = 10 }, -- map
}
```

## When Mixed Tables Are Acceptable

A table can legitimately have both a small sequence part and metadata fields, as long as consumers never call `#`/`ipairs` expecting the metadata keys to be included, e.g. `{ 1, 2, 3, n = 3 }` from `table.pack`. Document the shape when you do this.

## See Also

- [table-no-holes](table-no-holes.md)
- [table-pairs-vs-ipairs](table-pairs-vs-ipairs.md)
- [table-length-operator](table-length-operator.md)
