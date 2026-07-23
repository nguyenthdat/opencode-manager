# fn-multiple-returns

> Use multiple return values instead of out-parameters or wrapper tables

## Why It Matters

Lua functions can return any number of values directly, which is more idiomatic and often cheaper than allocating a table just to bundle 2-3 related results. This is also how the standard library reports success/failure (`nil, err`) and iteration state (`next(t, k)`), so leaning on it keeps your API consistent with the language itself.

## Bad

```lua
-- Allocates a table just to return two related values
local function divide(a, b)
  if b == 0 then
    return { ok = false, err = "division by zero" }
  end
  return { ok = true, value = a / b }
end

local result = divide(10, 2)
if result.ok then
  print(result.value)
end
```

## Good

```lua
-- Multiple return values: no allocation, and matches stdlib conventions
local function divide(a, b)
  if b == 0 then
    return nil, "division by zero"
  end
  return a / b
end

local value, err = divide(10, 2)
if not value then
  print("error: " .. err)
else
  print(value)
end

-- Returning a coordinate pair, a min/max range, etc. -- all natural
-- candidates for multiple returns rather than a wrapper table
local function min_max(numbers)
  local lo, hi = numbers[1], numbers[1]
  for _, n in ipairs(numbers) do
    if n < lo then lo = n end
    if n > hi then hi = n end
  end
  return lo, hi
end

local lo, hi = min_max({ 3, 1, 4, 1, 5, 9 })
```

## When a Table Is Better

Once you have more than ~3-4 related values, or the values are optional/named, a table (or an options-style result) communicates intent better than a long list of positional returns that are easy to mix up.

## See Also

- [fn-varargs-handling](fn-varargs-handling.md)
- [err-nil-err-pattern](err-nil-err-pattern.md)
- [perf-avoid-multiple-returns-alloc](perf-avoid-multiple-returns-alloc.md)
