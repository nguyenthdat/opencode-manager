# meta-tostring

> Implement `__tostring` for readable debugging and printing

## Why It Matters

Without `__tostring`, `print(my_object)` shows something like `table: 0x55b3f2a1c220` — a memory address, useless for debugging. Implementing `__tostring` (which `tostring()`, `print()`, and string coercion via `..` for errors all respect) makes objects self-describing in logs and error messages, at almost no cost.

## Bad

```lua
local User = {}
User.__index = User

function User.new(name, id)
  return setmetatable({ name = name, id = id }, User)
end

local u = User.new("Alice", 42)
print(u)                      -- table: 0x55b3f2a1c220 -- unhelpful
print("user: " .. tostring(u)) -- same problem in log lines
```

## Good

```lua
local User = {}
User.__index = User

User.__tostring = function(self)
  return ("User(id=%d, name=%q)"):format(self.id, self.name)
end

function User.new(name, id)
  return setmetatable({ name = name, id = id }, User)
end

local u = User.new("Alice", 42)
print(u)                       -- User(id=42, name="Alice")
print("user: " .. tostring(u)) -- user: User(id=42, name="Alice")
```

## Note: `__tostring` Does Not Fix `..` Directly

The `..` (concat) operator uses `__concat`, not `__tostring`, when either operand isn't already a string/number. Use explicit `tostring()` before concatenating, or define `__concat` too if you want `object .. string` to work directly:

```lua
-- print("user: " .. u) -- errors: attempt to concatenate a table value
print("user: " .. tostring(u))  -- correct: explicit tostring()
```

## See Also

- [meta-operator-overload](meta-operator-overload.md)
- [doc-class-annotations](doc-class-annotations.md)
- [err-error-table](err-error-table.md)
