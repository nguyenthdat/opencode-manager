# perf-avoid-metatable-hot-path

> Avoid unnecessary metatable indirection in hot code

## Why It Matters

Every access to a key that's absent on a table (triggering `__index`) or an operator on a table with metamethods (`__add`, `__eq`) costs more than a direct field access or primitive operation — usually negligible, but measurable in the innermost loop of a performance-critical system (physics simulation, per-pixel image processing, a parser's tightest inner loop).

## Bad

```lua
-- Vector class with __add/__index used inside the hottest loop of a
-- particle simulation running thousands of times per frame
local Vector = {}
Vector.__index = Vector
Vector.__add = function(a, b) return setmetatable({ x = a.x + b.x, y = a.y + b.y }, Vector) end

local function simulate_particles(particles, gravity, dt)
  for _, p in ipairs(particles) do
    p.velocity = p.velocity + gravity * dt   -- metamethod + table allocation, every particle, every frame
    p.position = p.position + p.velocity * dt
  end
end
```

## Good

```lua
-- Flatten to raw numbers in the innermost loop; keep the Vector abstraction
-- only at the boundaries where code needs its ergonomics, not inside the
-- per-particle, per-frame hot path
local function simulate_particles(particles, gravity_x, gravity_y, dt)
  for _, p in ipairs(particles) do
    p.vx = p.vx + gravity_x * dt
    p.vy = p.vy + gravity_y * dt
    p.x = p.x + p.vx * dt
    p.y = p.y + p.vy * dt
  end
end
```

## Profile Before Flattening

This trade-off sacrifices some code clarity for speed — only apply it to code that profiling has shown is actually a bottleneck; keep the friendlier metatable-based API everywhere else.

## See Also

- [meta-operator-overload](meta-operator-overload.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [perf-profile-first](perf-profile-first.md)
