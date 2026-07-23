# doc-class-annotations

> Use `---@class` annotations for metatable-based "classes"

## Why It Matters

`lua-language-server` uses `---@class` (plus `---@field`) to understand the shape of your metatable-based types — without it, editor tooling sees every instance as an untyped, generic table and can't offer field autocomplete or catch typos in field names.

## Bad

```lua
local User = {}
User.__index = User

function User.new(name, age)
  return setmetatable({ name = name, age = age }, User)
end

-- Editor has no idea `u.name`/`u.age` exist, or what type they are
local u = User.new("Alice", 30)
print(u.naem)  -- typo silently accepted by the editor, only fails at runtime
```

## Good

```lua
---@class User
---@field name string
---@field age number
local User = {}
User.__index = User

---@param name string
---@param age number
---@return User
function User.new(name, age)
  return setmetatable({ name = name, age = age }, User)
end

local u = User.new("Alice", 30)
print(u.name)  -- autocompletes; a typo like u.naem is now flagged by the editor
```

## Annotating Inheritance

```lua
---@class Animal
---@field name string
local Animal = {}
Animal.__index = Animal

---@class Dog: Animal
---@field breed string
local Dog = setmetatable({}, { __index = Animal })
Dog.__index = Dog
```

## See Also

- [doc-emmylua-annotations](doc-emmylua-annotations.md)
- [meta-class-pattern](meta-class-pattern.md)
- [lint-type-check-lua-ls](lint-type-check-lua-ls.md)
