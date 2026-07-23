# fn-tail-calls

> Use proper tail calls for iteration to avoid unbounded stack growth

## Why It Matters

Lua guarantees proper tail-call elimination: `return f(...)` — where the call is the *entire* return expression, with nothing wrapping it — reuses the current stack frame instead of growing the call stack. This lets recursive algorithms iterate indefinitely without ever overflowing, as long as the recursive call is written as a genuine tail call.

## Bad

```lua
-- NOT a tail call: the `+ 1` means there's still work to do after the
-- recursive call returns, so a new stack frame must be kept alive
local function count_down_bad(n, acc)
  if n <= 0 then return acc end
  return 1 + count_down_bad(n - 1, acc)   -- not a tail call: "1 + ..." wraps it
end
-- count_down_bad(1e7)  -- stack overflow on many Lua builds
```

## Good

```lua
-- Proper tail call: `return f(...)` with nothing wrapping the call
local function count_down(n, acc)
  acc = acc or 0
  if n <= 0 then return acc end
  return count_down(n - 1, acc + 1)   -- true tail call: reuses the stack frame
end

print(count_down(10000000))  -- runs fine, constant stack usage
```

## What Breaks Tail-Call Elimination

```lua
-- Any of these disqualify the call from being a proper tail call:
return (f())            -- extra parentheses truncate to 1 return value, not a tail call
return f() + 0          -- wrapped in an expression
local x = f(); return x -- not written as `return f(...)` directly
return pcall(f)         -- pcall itself is a real call frame; f() inside it is not a tail call
```

## Version Note

Proper tail calls are a language guarantee across Lua 5.1-5.4 and LuaJIT (in both its interpreter and JIT-compiled code) — this is one of the more stable parts of the language across versions.

## See Also

- [fn-recursive-local](fn-recursive-local.md)
- [scope-upvalue-limit](scope-upvalue-limit.md)
- [perf-numeric-for](perf-numeric-for.md)
