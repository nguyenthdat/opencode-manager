# meta-class-pattern

> Follow the standard class-emulation pattern: `setmetatable` + `__index = Class`

## Why It Matters

Lua has no built-in class system, but the community has converged on one dominant idiom for OOP: a table representing the "class" whose `__index` points at itself, a `.new()` constructor, and colon-syntax methods (`function Class:method(...)`) which implicitly pass `self`. Recognizing and following this exact shape makes your code instantly readable to any experienced Lua developer.

## Bad

```lua
-- Ad hoc, inconsistent "OOP" that doesn't follow the recognizable idiom
local function make_counter(start)
  local self = { value = start }
  self.increment = function() self.value = self.value + 1 end
  self.get = function() return self.value end
  return self
end
```

## Good

```lua
local Counter = {}
Counter.__index = Counter

function Counter.new(start)
  return setmetatable({ value = start or 0 }, Counter)
end

function Counter:increment(step)
  self.value = self.value + (step or 1)
end

function Counter:get()
  return self.value
end

local c = Counter.new(10)
c:increment()      -- sugar for Counter.increment(c)
c:increment(5)
print(c:get())     -- 16
```

## Colon vs. Dot Syntax

```lua
-- These are exactly equivalent:
c:increment(5)
Counter.increment(c, 5)

-- Define methods with colon syntax so `self` is implicit and consistent:
function Counter:increment(step) ... end   -- self is implicit
function Counter.new(start) ... end        -- no self needed -- it's a constructor
```

## See Also

- [meta-index-inheritance](meta-index-inheritance.md)
- [meta-new-constructor](meta-new-constructor.md)
- [name-pascal-case-classes](name-pascal-case-classes.md)
