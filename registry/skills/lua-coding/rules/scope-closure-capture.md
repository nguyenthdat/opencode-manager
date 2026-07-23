# scope-closure-capture

> Understand upvalue capture semantics before creating closures in loops

## Why It Matters

Lua closures capture *variables* (upvalues) by reference, not by value. Since Lua 5.4, each iteration of a numeric/generic `for` loop creates a **fresh** local for the control variable, so closures created in different iterations capture different variables — this differs from some other languages' historical loop-variable-sharing pitfalls, but it's easy to get wrong when the captured variable is declared *outside* the loop, e.g. in a `while` loop.

## Bad

```lua
local callbacks = {}
local i = 0
while i < 3 do
  i = i + 1
  -- All three closures capture the SAME upvalue `i`, not a snapshot of it
  callbacks[i] = function() print(i) end
end

for _, cb in ipairs(callbacks) do cb() end
-- prints 3, 3, 3 -- not 1, 2, 3
```

## Good

```lua
local callbacks = {}
local i = 0
while i < 3 do
  i = i + 1
  local captured = i   -- fresh local each iteration -- its own upvalue
  callbacks[i] = function() print(captured) end
end

for _, cb in ipairs(callbacks) do cb() end
-- prints 1, 2, 3 as expected

-- Lua's own `for` loop already gives each iteration a fresh control variable,
-- so this pattern is safe without an extra local:
local callbacks2 = {}
for n = 1, 3 do
  callbacks2[n] = function() print(n) end  -- each `n` is a distinct upvalue
end
for _, cb in ipairs(callbacks2) do cb() end
-- prints 1, 2, 3
```

## See Also

- [fn-closures-encapsulate-state](fn-closures-encapsulate-state.md)
- [scope-loop-variable-capture](scope-loop-variable-capture.md)
- [fn-no-closures-hot-loop](fn-no-closures-hot-loop.md)
