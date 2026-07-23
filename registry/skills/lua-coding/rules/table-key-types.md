# table-key-types

> Use consistent, hashable key types; beware float/int key collisions and `NaN`

## Why It Matters

Lua tables key by raw value equality. Since Lua 5.3 introduced the integer subtype, a float key that represents a whole number (`2.0`) is normalized to the integer key `2` before being used to index a table — so `t[2]` and `t[2.0]` refer to the same slot. `NaN` as a key raises an error, and `nil` as a key is always an error. Mixing numeric key styles without understanding this normalization causes subtle "duplicate" entries or crashes.

## Bad

```lua
local counts = {}
counts[2] = "int key"
counts[2.0] = "float key"      -- in 5.3+, this OVERWRITES counts[2]
print(counts[2])                -- "float key", the int entry is gone

-- Using NaN or nil as a key crashes at runtime
local key = 0/0                 -- NaN
-- counts[key] = "bad"          -- error: table index is NaN

local t = {}
-- t[nil] = "bad"                -- error: table index is nil
```

## Good

```lua
-- Be deliberate: use one numeric representation consistently
local counts = {}
counts[2] = 0
counts[2] = counts[2] + 1        -- always integer keys, no float/int ambiguity

-- Guard against non-hashable keys explicitly at API boundaries
local function safe_set(t, key, value)
  if key == nil then
    error("table key must not be nil", 2)
  end
  if key ~= key then  -- NaN check: NaN is the only value not equal to itself
    error("table key must not be NaN", 2)
  end
  t[key] = value
end

-- When keys come from user input or floating point math, normalize first
local function normalize_key(k)
  if type(k) == "number" and k == math.floor(k) then
    return math.tointeger(k) or k  -- math.tointeger is Lua 5.3+
  end
  return k
end
```

## See Also

- [scope-const-attribute](scope-const-attribute.md)
- [table-array-vs-dict](table-array-vs-dict.md)
- [err-validate-args](err-validate-args.md)
