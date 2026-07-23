# scope-loop-variable-capture

> Know your target Lua version's loop-variable-per-iteration semantics

## Why It Matters

Lua has always given the `for` loop's control variable fresh scope per iteration (this is standard across 5.1-5.4 and LuaJIT), so closures created inside a `for` loop correctly capture a distinct variable each time. The pitfall is assuming the same guarantee applies to variables declared *outside* the loop and merely mutated inside it (e.g. in a `while` loop, or a manually incremented counter) — those are a single shared upvalue across all closures.

## Bad

```lua
-- Assuming (wrongly) that `idx` behaves like a fresh per-iteration binding
local handlers = {}
local idx = 0
repeat
  idx = idx + 1
  handlers[idx] = function() return idx end   -- shared upvalue!
until idx >= 3

print(handlers[1](), handlers[2](), handlers[3]())  -- 3  3  3
```

## Good

```lua
-- The `for` loop's control variable is genuinely fresh each iteration
local handlers = {}
for idx = 1, 3 do
  handlers[idx] = function() return idx end  -- distinct upvalue per iteration
end
print(handlers[1](), handlers[2](), handlers[3]())  -- 1  2  3

-- If you must use while/repeat, snapshot into a fresh local yourself
local handlers2 = {}
local i = 0
while i < 3 do
  i = i + 1
  local snapshot = i
  handlers2[i] = function() return snapshot end
end
print(handlers2[1](), handlers2[2](), handlers2[3]())  -- 1  2  3
```

## See Also

- [scope-closure-capture](scope-closure-capture.md)
- [fn-no-closures-hot-loop](fn-no-closures-hot-loop.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
