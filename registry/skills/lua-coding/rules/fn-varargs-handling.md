# fn-varargs-handling

> Handle `...` safely with `select('#', ...)` and `table.pack`

## Why It Matters

`...` (varargs) can contain `nil` values in the middle, which breaks naive uses of `{...}` combined with `#` — the same hole problem as regular tables. `select('#', ...)` gives the true argument count (including trailing/embedded nils), and `table.pack(...)` (5.2+) captures both the values and that count safely.

## Bad

```lua
local function count_args(...)
  local args = { ... }
  return #args   -- WRONG if any argument is nil: undercounts or is unreliable
end

print(count_args(1, nil, 3))  -- might print 1, not 3 -- silent bug
```

## Good

```lua
local function count_args(...)
  return select("#", ...)   -- always correct, even with embedded/trailing nils
end

print(count_args(1, nil, 3))  -- 3, correct

-- table.pack captures values AND the true count together (Lua 5.2+)
local function collect(...)
  local packed = table.pack(...)   -- { [1]=1, [2]=nil, [3]=3, n = 3 }
  for i = 1, packed.n do
    print(i, packed[i])
  end
end

-- select(n, ...) also extracts a suffix of arguments starting at position n
local function second_onward(...)
  return select(2, ...)
end
print(second_onward("a", "b", "c"))  -- b  c
```

## Lua 5.1 / LuaJIT Note

`table.pack`/`table.unpack` were added in 5.2; on 5.1/LuaJIT use the global `unpack` and manually track a count with `select('#', ...)` since there is no built-in packing helper.

## See Also

- [fn-multiple-returns](fn-multiple-returns.md)
- [fn-variadic-forwarding](fn-variadic-forwarding.md)
- [table-no-holes](table-no-holes.md)
