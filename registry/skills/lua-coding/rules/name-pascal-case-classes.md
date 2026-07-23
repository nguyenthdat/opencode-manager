# name-pascal-case-classes

> Use `PascalCase` for metatable-based "classes"

## Why It Matters

Since Lua has no built-in class keyword, the table that plays the role of a "class" (holding shared methods, used as `__index`) benefits from a distinct naming convention so readers can instantly tell "this identifier names a type" apart from "this identifier is a regular function or variable" — mirroring class-naming conventions from mainstream OOP languages.

## Bad

```lua
local animal = {}          -- looks like an instance/value, not a class
animal.__index = animal

function animal.new(name)
  return setmetatable({ name = name }, animal)
end

local rex = animal.new("Rex")
```

## Good

```lua
local Animal = {}          -- PascalCase signals "this is a class/type"
Animal.__index = Animal

function Animal.new(name)
  return setmetatable({ name = name }, Animal)
end

local rex = Animal.new("Rex")   -- rex (instance) stays snake_case/lowercase
```

## Instances Stay `snake_case`

```lua
local Dog = setmetatable({}, { __index = Animal })
Dog.__index = Dog

local my_dog = Dog.new("Fido")    -- instance: lowercase/snake_case
local AnotherDog = Dog.new("Rex") -- wrong: instances are not classes, don't PascalCase them
```

## See Also

- [meta-class-pattern](meta-class-pattern.md)
- [name-snake-case-funcs](name-snake-case-funcs.md)
- [doc-class-annotations](doc-class-annotations.md)
