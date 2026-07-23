# perf-numeric-for

> Prefer the numeric `for` over the generic `for` when iterating a known range

## Why It Matters

The numeric `for i = a, b, step do` loop is compiled to a tight, specialized bytecode form with no per-iteration function call, whereas the generic `for` (`for k, v in iterator(...) do`) calls an iterator function every iteration. For plain integer-indexed sequences where you already know the bounds, the numeric form avoids that per-iteration call overhead — and LuaJIT's tracing JIT specializes numeric loops especially well.

## Bad

```lua
-- ipairs() calls an iterator function on every single iteration
local function sum(numbers)
  local total = 0
  for _, n in ipairs(numbers) do
    total = total + n
  end
  return total
end
```

## Good

```lua
-- Numeric for: no iterator function call, direct indexed access
local function sum(numbers)
  local total = 0
  for i = 1, #numbers do
    total = total + numbers[i]
  end
  return total
end
```

## When `ipairs`/Generic `for` Is the Better Choice

For anything other than the tightest numeric hot loops, `ipairs` is clearer, less error-prone (no off-by-one risk on the bound), and the performance difference is usually immaterial — especially under LuaJIT, whose JIT compiler frequently erases the difference entirely for simple sequence iteration. Reach for the numeric form specifically when profiling shows the iterator call overhead matters.

```lua
-- Perfectly fine outside hot loops -- prefer this by default
for _, item in ipairs(items) do
  process(item)
end
```

## See Also

- [table-pairs-vs-ipairs](table-pairs-vs-ipairs.md)
- [perf-local-cache-globals](perf-local-cache-globals.md)
- [perf-profile-first](perf-profile-first.md)
