# meta-new-constructor

> Provide an explicit `.new()` constructor function per class

## Why It Matters

A dedicated `.new()` function is the conventional, discoverable place to validate constructor arguments, set defaults, and perform the single `setmetatable` call. Without it, object construction gets duplicated and inconsistently initialized across the codebase — some call sites forget a default field, others forget to set the metatable at all.

## Bad

```lua
local Rectangle = {}
Rectangle.__index = Rectangle

function Rectangle:area()
  return self.width * self.height
end

-- Every call site has to remember the exact construction incantation
local r1 = setmetatable({ width = 4, height = 5 }, Rectangle)
local r2 = setmetatable({ width = 2 }, Rectangle)  -- forgot height! bug waiting to happen
```

## Good

```lua
local Rectangle = {}
Rectangle.__index = Rectangle

function Rectangle.new(width, height)
  assert(type(width) == "number" and width > 0, "width must be a positive number")
  assert(type(height) == "number" and height > 0, "height must be a positive number")
  return setmetatable({ width = width, height = height }, Rectangle)
end

function Rectangle:area()
  return self.width * self.height
end

local r1 = Rectangle.new(4, 5)
-- local r2 = Rectangle.new(2)  -- errors immediately: height must be a positive number
```

## Constructors With Defaults and Named Options

```lua
function Rectangle.new(opts)
  opts = opts or {}
  return setmetatable({
    width = opts.width or 1,
    height = opts.height or 1,
    color = opts.color or "black",
  }, Rectangle)
end

local square = Rectangle.new({ width = 5, height = 5, color = "red" })
```

## See Also

- [meta-class-pattern](meta-class-pattern.md)
- [api-options-table](api-options-table.md)
- [err-validate-args](err-validate-args.md)
