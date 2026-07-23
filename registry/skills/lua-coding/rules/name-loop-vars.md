# name-loop-vars

> Follow conventional loop variable names: `i`, `j`, `k`, `v`, `_` for unused

## Why It Matters

Short, conventional loop variable names (`i` for an outer index, `j`/`k` for nested loop indices, `v` for a generic value in `ipairs`, `k`/`v` for `pairs`, `_` for an intentionally unused binding) are instantly recognizable and don't need to carry semantic weight the way a named business variable does — using verbose or inconsistent names for trivial loop counters adds noise without adding clarity.

## Bad

```lua
for indexValue = 1, 10 do            -- overly verbose for a simple counter
  for secondaryIndexValue = 1, 10 do  -- and now nested naming gets unwieldy
    matrix[indexValue][secondaryIndexValue] = 0
  end
end

for indexNotUsed, itemValue in ipairs(items) do  -- unused index given a full name
  process(itemValue)
end
```

## Good

```lua
for i = 1, 10 do
  for j = 1, 10 do
    matrix[i][j] = 0
  end
end

for _, item in ipairs(items) do   -- `_` signals the index is intentionally unused
  process(item)
end

for key, value in pairs(config) do  -- `key`/`value` when both ARE meaningfully used
  print(key, value)
end
```

## Longer Names Are Fine When the Loop Body Is Complex

For loops with substantial bodies where the loop variable is referenced many times far from its declaration, a more descriptive name (`user`, `request`, `order`) aids readability more than a terse `i`/`v` would:

```lua
for _, order in ipairs(pending_orders) do
  if order.total > threshold and order.customer.is_verified then
    process_high_value_order(order)
  end
end
```

## See Also

- [name-private-underscore](name-private-underscore.md)
- [table-pairs-vs-ipairs](table-pairs-vs-ipairs.md)
- [perf-numeric-for](perf-numeric-for.md)
