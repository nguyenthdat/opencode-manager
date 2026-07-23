# fn-named-vs-anonymous

> Prefer named local functions for recursion and readable stack traces

## Why It Matters

An anonymous function assigned to a local can't refer to itself by name for recursion (the local isn't in scope yet at the point the function body is being defined, unless declared first). Named functions also show up by name in `debug.traceback()` output, whereas anonymous functions appear as `function <file:line>`, making crash logs harder to read.

## Bad

```lua
-- Trying to recurse from an anonymous function assigned to a local fails,
-- because `factorial` isn't in scope yet inside its own function body
local factorial = function(n)
  if n <= 1 then return 1 end
  return n * factorial(n - 1)  -- refers to the OLD/global `factorial`, not this one,
                                -- unless `local factorial` was pre-declared -- fragile
end
```

## Good

```lua
-- `local function name(...)` is sugar for `local name; name = function(...)`,
-- so `name` IS in scope inside its own body -- correct and idiomatic
local function factorial(n)
  if n <= 1 then return 1 end
  return n * factorial(n - 1)
end

-- Named functions also produce readable tracebacks:
local function risky()
  error("boom")
end

local ok, err = xpcall(risky, debug.traceback)
print(err)
-- ...
-- stack traceback:
--     [C]: in function 'error'
--     file.lua:14: in function 'risky'   <-- named, easy to read
```

## Anonymous Functions Are Still Fine For...

Short, non-recursive, one-off callbacks (event handlers, comparators passed inline) are perfectly idiomatic as anonymous functions — the concern is specifically about recursion and debuggability of longer-lived named operations.

```lua
table.sort(items, function(a, b) return a.name < b.name end)  -- fine, anonymous
```

## See Also

- [fn-recursive-local](fn-recursive-local.md)
- [fn-tail-calls](fn-tail-calls.md)
- [err-xpcall-traceback](err-xpcall-traceback.md)
