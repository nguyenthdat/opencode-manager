# meta-index-inheritance

> Use `__index` for prototype-based inheritance

## Why It Matters

When a table lookup misses (`t.field` is `nil`), Lua consults the table's metatable's `__index` — either another table (chained lookup) or a function (computed fallback). This single mechanism is how Lua emulates "inheritance": an instance's metatable's `__index` points at its "class" table, so undefined fields fall through to shared methods/defaults.

## Bad

```lua
-- Copying every method into every instance -- wastes memory, and updates
-- to the "class" don't propagate to existing instances
local function new_animal(name)
  return {
    name = name,
    speak = function(self) print(self.name .. " makes a sound") end,
    describe = function(self) return "Animal: " .. self.name end,
  }
end
```

## Good

```lua
local Animal = {}
Animal.__index = Animal   -- instances fall through to Animal for missing keys

function Animal.new(name)
  return setmetatable({ name = name }, Animal)
end

function Animal:speak()
  print(self.name .. " makes a sound")
end

function Animal:describe()
  return "Animal: " .. self.name
end

local a = Animal.new("Rex")
a:speak()               -- looked up via __index -> Animal.speak
print(a:describe())     -- looked up via __index -> Animal.describe

-- One Animal table shared by every instance; adding a method later
-- is instantly visible to all existing instances too
function Animal:rename(new_name)
  self.name = new_name
end
```

## `__index` as a Function

```lua
-- Computed fallback instead of a fixed table -- useful for lazy defaults
local WithDefaults = setmetatable({}, {
  __index = function(_, key)
    return "default_" .. key
  end,
})
print(WithDefaults.color)  -- "default_color"
```

## See Also

- [meta-class-pattern](meta-class-pattern.md)
- [meta-inheritance-chain](meta-inheritance-chain.md)
- [meta-newindex-guard](meta-newindex-guard.md)
