# meta-operator-overload

> Use metamethods (`__add`, `__eq`, `__lt`, `__concat`, ...) for operator overloading

## Why It Matters

Metamethods let custom types (vectors, durations, money amounts) support natural operator syntax (`a + b`, `a == b`, `a < b`) instead of verbose method calls (`a:add(b)`). Used sparingly on types where the operator has one unambiguous, expected meaning, this makes call-site code read naturally; overloading operators for unrelated meanings is confusing and should be avoided.

## Bad

```lua
local Vector = {}
Vector.__index = Vector

function Vector.new(x, y) return setmetatable({ x = x, y = y }, Vector) end

function Vector:add(other)
  return Vector.new(self.x + other.x, self.y + other.y)
end

-- Verbose call sites for something that's naturally an operator
local result = a:add(b):add(c)
```

## Good

```lua
local Vector = {}
Vector.__index = Vector

function Vector.new(x, y) return setmetatable({ x = x, y = y }, Vector) end

Vector.__add = function(a, b)
  return Vector.new(a.x + b.x, a.y + b.y)
end

Vector.__eq = function(a, b)
  return a.x == b.x and a.y == b.y
end

Vector.__tostring = function(v)
  return ("Vector(%g, %g)"):format(v.x, v.y)
end

local a = Vector.new(1, 2)
local b = Vector.new(3, 4)
local result = a + b            -- reads naturally
print(result)                    -- Vector(4, 6)
print(a == Vector.new(1, 2))     -- true
```

## Common Metamethods

| Metamethod | Operator |
|---|---|
| `__add`, `__sub`, `__mul`, `__div`, `__mod`, `__pow`, `__unm` | `+ - * / % ^ -` |
| `__idiv` | `//` (5.3+) |
| `__band`, `__bor`, `__bxor`, `__bnot`, `__shl`, `__shr` | `& \| ~ ~ << >>` (5.3+, integers) |
| `__concat` | `..` |
| `__len` | `#` (5.2+) |
| `__eq`, `__lt`, `__le` | `== < <=` |
| `__call` | `f(...)` |
| `__tostring` | `tostring(v)` / `print(v)` |

## When Not to Overload

Don't overload `+` to mean something other than addition (e.g. don't make `a + b` merge two unrelated collections in a surprising way) — surprising operator semantics are worse than no operator at all.

## See Also

- [meta-eq-semantics](meta-eq-semantics.md)
- [meta-tostring](meta-tostring.md)
- [meta-call-functor](meta-call-functor.md)
