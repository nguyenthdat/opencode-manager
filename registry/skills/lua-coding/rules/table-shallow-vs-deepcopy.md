# table-shallow-vs-deepcopy

> Choose shallow or deep copy deliberately, and name the function accordingly

## Why It Matters

Because tables are reference types, `local b = a` aliases the same table rather than copying it. Developers often reach for an ad hoc "copy" that only copies one level deep, then are surprised when a nested table is still shared and mutations leak between "copies". Being explicit about shallow vs. deep avoids subtle aliasing bugs, especially in config objects and game entity state.

## Bad

```lua
-- Looks like a copy, but nested tables are still shared references
local function copy(t)
  local result = {}
  for k, v in pairs(t) do
    result[k] = v
  end
  return result
end

local original = { name = "enemy", stats = { hp = 100 } }
local clone = copy(original)
clone.stats.hp = 0        -- mutates original.stats too! shared reference
print(original.stats.hp)  -- 0, not 100 -- surprising bug
```

## Good

```lua
-- Explicit shallow copy: only top-level keys are independent
local function shallow_copy(t)
  local result = {}
  for k, v in pairs(t) do
    result[k] = v
  end
  return result
end

-- Explicit deep copy: recursively copies nested tables
local function deep_copy(t, seen)
  if type(t) ~= "table" then return t end
  seen = seen or {}
  if seen[t] then return seen[t] end  -- handle cycles

  local result = {}
  seen[t] = result
  for k, v in pairs(t) do
    result[deep_copy(k, seen)] = deep_copy(v, seen)
  end
  return setmetatable(result, getmetatable(t))
end

local original = { name = "enemy", stats = { hp = 100 } }
local clone = deep_copy(original)
clone.stats.hp = 0
print(original.stats.hp)  -- 100, unaffected
```

## When Shallow Copy Is the Right Choice

Use shallow copy when nested tables are meant to be shared on purpose (e.g. a shared texture/asset table referenced by many entities), or when the table is known to be flat. Deep copy costs more and can loop forever on cyclic structures if you skip the `seen` table — always guard against cycles in a general-purpose deep copy.

## See Also

- [table-nested-ownership](table-nested-ownership.md)
- [meta-weak-tables](meta-weak-tables.md)
- [anti-deep-nested-mutation](anti-deep-nested-mutation.md)
