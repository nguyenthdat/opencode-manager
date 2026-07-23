# fn-recursive-local

> Declare `local function name` (not `local name = function`) for correct recursion

## Why It Matters

`local function foo() ... end` is sugar for `local foo; foo = function() ... end` — the local is declared *before* the function body is compiled, so a call to `foo` inside its own body correctly refers to itself. Writing `local foo = function() ... end` instead declares and assigns in one step, but the function body is compiled while `foo` is still just an ordinary (not-yet-assigned) reference in the *enclosing* scope, which breaks self-recursion if `foo` shadows an outer name, or silently calls a stale/global `foo`.

## Bad

```lua
-- Looks equivalent to the correct form, but isn't for recursion
local fib = function(n)
  if n < 2 then return n end
  return fib(n - 1) + fib(n - 2)  -- refers to outer/global `fib`, NOT this local,
                                   -- unless this happens to be the top-level scope
                                   -- with no shadowing -- fragile and easy to break
                                   -- when refactored into a nested scope
end
```

## Good

```lua
-- `local function` pre-declares the name, so recursion refers to itself correctly
local function fib(n)
  if n < 2 then return n end
  return fib(n - 1) + fib(n - 2)
end

print(fib(10))  -- 55

-- This matters most once the function is nested inside another scope,
-- where an outer `fib` (if any existed) would otherwise be shadowed:
local function make_calculator()
  local function fib(n)      -- correctly self-referential even when nested
    if n < 2 then return n end
    return fib(n - 1) + fib(n - 2)
  end
  return fib
end
```

## See Also

- [fn-named-vs-anonymous](fn-named-vs-anonymous.md)
- [fn-tail-calls](fn-tail-calls.md)
- [scope-shadowing](scope-shadowing.md)
