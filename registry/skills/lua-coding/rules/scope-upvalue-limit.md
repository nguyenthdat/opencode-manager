# scope-upvalue-limit

> Be aware of the ~200 local/upvalue limit per function

## Why It Matters

The reference Lua implementation limits each function to 200 local variables and 255 (or 200, version-dependent) upvalues, and 200 registers overall in some builds. This is rarely hit in hand-written code, but generated code, heavily unrolled loops, or a function with an enormous number of named temporaries can exceed it, producing a compile-time error like `too many local variables` — confusing if you don't know the limit exists.

## Bad

```lua
-- Generated/unrolled code with hundreds of named locals in one function
local function decode_packet(buf)
  local field1 = buf:byte(1)
  local field2 = buf:byte(2)
  -- ... imagine this pattern repeated 250 times ...
  local field250 = buf:byte(250)
  return { field1, field2 --[[, ... , field250]] }
end
-- error: too many local variables (limit is 200) in main function near '<eof>'
```

## Good

```lua
-- Use a table/loop instead of hundreds of individually named locals
local function decode_packet(buf)
  local fields = {}
  for i = 1, #buf do
    fields[i] = buf:byte(i)
  end
  return fields
end

-- Or split the work across smaller helper functions, each with its own
-- local budget, if named fields are genuinely required
local function decode_header(buf) --[[ uses locals 1-20 ]] end
local function decode_body(buf)   --[[ uses locals 1-20, separate function ]] end
```

## See Also

- [scope-minimize-scope](scope-minimize-scope.md)
- [fn-tail-calls](fn-tail-calls.md)
- [proj-single-responsibility-module](proj-single-responsibility-module.md)
