# meta-inheritance-chain

> Chain metatables deliberately for multi-level "inheritance"

## Why It Matters

Because `__index` can itself be a table with its own `__index` metamethod, Lua supports arbitrarily deep inheritance chains — but each level of chaining costs a lookup at runtime, and undisciplined chains become as hard to follow as deep class hierarchies in any language. Keep chains shallow (1-2 levels) and make the relationship explicit with a helper.

## Bad

```lua
-- Ad hoc chaining with no shared convention -- hard to see the hierarchy
local Animal = { __index = {} }
local Dog = setmetatable({}, Animal)
Dog.__index = Dog
setmetatable(Dog, { __index = Animal.__index })  -- confusing double indirection
```

## Good

```lua
local Animal = {}
Animal.__index = Animal

function Animal.new(name)
  return setmetatable({ name = name }, Animal)
end

function Animal:speak()
  print(self.name .. " makes a sound")
end

-- A small helper makes "class extends class" explicit and consistent
local function extend(base)
  local child = setmetatable({}, { __index = base })
  child.__index = child
  return child
end

local Dog = extend(Animal)

function Dog.new(name, breed)
  local self = Animal.new(name)
  self.breed = breed
  return setmetatable(self, Dog)
end

function Dog:speak()  -- overrides Animal:speak
  print(self.name .. " barks")
end

local rex = Dog.new("Rex", "Labrador")
rex:speak()               -- "Rex barks" (Dog's own method)
print(rex.name)            -- falls through Dog -> Animal is unnecessary here since
                            -- name was copied by Animal.new, but methods still chain:
```

## Preferring Composition Over Deep Chains

For more than two levels, prefer composing behavior from smaller pieces (see mixins) rather than a long inheritance chain — deep chains make it hard to know which ancestor actually defines a given method.

## See Also

- [meta-index-inheritance](meta-index-inheritance.md)
- [meta-mixins](meta-mixins.md)
- [meta-class-pattern](meta-class-pattern.md)
