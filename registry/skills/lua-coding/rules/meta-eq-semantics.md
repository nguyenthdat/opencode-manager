# meta-eq-semantics

> Know that `__eq` only triggers between two values of the *same* underlying type

## Why It Matters

`__eq` is only consulted when both operands are tables (or both are full userdata) that are not primitively equal (same reference) — Lua never calls `__eq` when comparing a table to a number, string, or `nil`. There's also a historical version wrinkle: in Lua 5.1 and 5.2, `__eq` is only checked when *both* operands share the *exact same* metamethod (both metatables must have the identical `__eq` function reference); Lua 5.3+ relaxed this to just require both operands be tables (or both userdata).

## Bad

```lua
local Point = {}
Point.__index = Point
Point.__eq = function(a, b) return a.x == b.x and a.y == b.y end

function Point.new(x, y) return setmetatable({ x = x, y = y }, Point) end

local p = Point.new(1, 2)
print(p == nil)          -- false, __eq is never even called for this -- fine
print(p == { x = 1, y = 2 })
-- On Lua 5.1/5.2: false, because the plain table on the right has NO
-- metatable, so the __eq check requiring matching metamethods fails silently.
-- On Lua 5.3+: still false, because __eq requires BOTH operands be tables,
-- which they are, but it uses the metamethod from either operand -- so this
-- specific case (no metatable on one side) still evaluates via __eq in 5.3+
-- and correctly returns true only if fields match.
```

## Good

```lua
-- Always compare same-typed, same-metatable objects, and never rely on
-- __eq firing against plain tables constructed ad hoc
local Point = {}
Point.__index = Point
Point.__eq = function(a, b) return a.x == b.x and a.y == b.y end

function Point.new(x, y) return setmetatable({ x = x, y = y }, Point) end

local p1 = Point.new(1, 2)
local p2 = Point.new(1, 2)
print(p1 == p2)   -- true on all versions: both are Point instances

-- If you need version-portable equality against arbitrary tables, provide
-- an explicit :equals() method instead of relying on __eq corner cases
function Point:equals(other)
  return type(other) == "table" and self.x == other.x and self.y == other.y
end
```

## See Also

- [meta-operator-overload](meta-operator-overload.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
- [meta-class-pattern](meta-class-pattern.md)
