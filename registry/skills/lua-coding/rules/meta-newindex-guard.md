# meta-newindex-guard

> Use `__newindex` to guard, validate, or virtualize field writes

## Why It Matters

`__newindex` intercepts writes to keys that don't already exist directly on the table, letting you validate incoming values, redirect writes to a backing store, or make a table effectively read-only. Without it, any code can write any garbage into any field with no feedback.

## Bad

```lua
local Point = {}
Point.__index = Point

function Point.new(x, y)
  return setmetatable({ x = x, y = y }, Point)
end

local p = Point.new(1, 2)
p.x = "not a number"   -- silently corrupts the point, no warning at all
```

## Good

```lua
local Point = {}
Point.__index = Point

local function validated_newindex(t, key, value)
  if (key == "x" or key == "y") and type(value) ~= "number" then
    error(("Point.%s must be a number, got %s"):format(key, type(value)), 2)
  end
  rawset(t, key, value)
end

function Point.new(x, y)
  local self = setmetatable({}, Point)
  self.__newindex = validated_newindex  -- note: set on the metatable, see below
  rawset(self, "x", x)
  rawset(self, "y", y)
  return self
end

-- In practice, __newindex belongs on the shared metatable, not per-instance:
local PointMeta = { __index = Point, __newindex = validated_newindex }
function Point.new2(x, y)
  return setmetatable({ x = x, y = y }, PointMeta)
end

local p = Point.new2(1, 2)
-- p.x = "bad"   -- would raise: Point.x must be a number, got string
```

## `rawset`/`rawget` Avoid Recursion

Inside `__newindex`/`__index`, always use `rawset`/`rawget` to actually store/read the underlying value — calling `t[key] = value` again from inside `__newindex` would re-trigger the metamethod and recurse.

## See Also

- [meta-index-inheritance](meta-index-inheritance.md)
- [table-readonly-proxy](table-readonly-proxy.md)
- [err-validate-args](err-validate-args.md)
