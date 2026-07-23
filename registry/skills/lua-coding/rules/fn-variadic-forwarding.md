# fn-variadic-forwarding

> Forward varargs correctly with `...` and `table.pack`/`table.unpack`

## Why It Matters

Wrapping a variadic function (a logging wrapper, a decorator, a memoizer) requires forwarding its arguments faithfully, including embedded/trailing `nil`s and the exact count. Doing this with a naive `{...}` and `unpack(t)` silently drops trailing nils because `unpack` without an explicit count stops at the first hole/`#`.

## Bad

```lua
local function logged(fn)
  return function(...)
    local args = { ... }
    print("calling with", #args, "args")   -- wrong count if any arg is nil
    local result = fn(unpack(args))         -- may drop trailing nil arguments
    return result
  end
end
```

## Good

```lua
local unpack = table.unpack or unpack  -- 5.2+ moved it to table.unpack

local function logged(fn)
  return function(...)
    local n = select("#", ...)
    local args = table.pack(...)
    print("calling with", n, "args")
    return fn(table.unpack(args, 1, args.n))  -- explicit range preserves nils
  end
end

local function example(a, b, c)
  return tostring(a), tostring(b), tostring(c)
end

local wrapped = logged(example)
print(wrapped(1, nil, 3))  -- correctly forwards all 3 arguments, including nil
```

## Forwarding Multiple Return Values Too

```lua
-- Forward both the call's arguments AND preserve all of its return values
local function timed(fn)
  return function(...)
    local start = os.clock()
    local results = table.pack(fn(...))
    print(("took %.4fs"):format(os.clock() - start))
    return table.unpack(results, 1, results.n)
  end
end
```

## See Also

- [fn-varargs-handling](fn-varargs-handling.md)
- [fn-multiple-returns](fn-multiple-returns.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
