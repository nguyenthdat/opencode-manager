# anti-string-dispatch

> Anti-pattern: string-based dynamic dispatch instead of a table lookup

## Why It Matters

Building a function/behavior name as a string and then calling `_G[name]()` or, worse, feeding it through `load()`, is slower than a direct table lookup, bypasses any static analysis or linting of the actual call target, and is a security liability if the string ever originates from untrusted input.

## Bad

```lua
-- Constructing a global function name dynamically and invoking it via _G
local function dispatch(action_name, ...)
  local fn = _G["handle_" .. action_name]   -- fragile: relies on globals existing
  if fn then return fn(...) end
end

dispatch("click", event)  -- looks for a global named handle_click

-- Worse: building and executing code from a string
local function run_action(action_name)
  local fn = load("return " .. action_name .. "()")  -- arbitrary code execution risk
  return fn()
end
```

## Good

```lua
-- Direct table lookup: no globals, no code generation, fast, and
-- immediately visible to any tool that reads this file
local handlers = {
  click = handle_click,
  hover = handle_hover,
  drag = handle_drag,
}

local function dispatch(action_name, ...)
  local fn = handlers[action_name]
  if not fn then
    error("no handler registered for action: " .. tostring(action_name))
  end
  return fn(...)
end

dispatch("click", event)
```

## See Also

- [fn-first-class-functions](fn-first-class-functions.md)
- [perf-avoid-select-hash](perf-avoid-select-hash.md)
- [anti-loadstring-eval](anti-loadstring-eval.md)
