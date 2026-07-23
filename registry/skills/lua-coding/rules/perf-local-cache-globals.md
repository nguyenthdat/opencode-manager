# perf-local-cache-globals

> Cache frequently accessed globals/table fields as locals in hot code

## Why It Matters

Reading a global (or a nested table field like `math.floor`) requires a table lookup every single time; reading a `local` is a direct register/upvalue access. In a hot loop that calls a standard-library function thousands of times, hoisting it into a local once outside the loop measurably reduces overhead — this is one of the most common, high-leverage Lua-specific optimizations, and idiomatic even outside hot paths for frequently used stdlib functions.

## Bad

```lua
local function normalize_all(points)
  for i = 1, #points do
    -- math.sqrt is looked up (math table, then sqrt field) on every iteration
    local len = math.sqrt(points[i].x ^ 2 + points[i].y ^ 2)
    points[i].x = points[i].x / len
    points[i].y = points[i].y / len
  end
end
```

## Good

```lua
local sqrt = math.sqrt   -- hoisted once, outside the loop

local function normalize_all(points)
  for i = 1, #points do
    local p = points[i]
    local len = sqrt(p.x ^ 2 + p.y ^ 2)
    p.x = p.x / len
    p.y = p.y / len
  end
end

-- Common at the top of a hot module: cache the stdlib functions it uses
local insert, concat, sort = table.insert, table.concat, table.sort
local floor, huge = math.floor, math.huge
```

## When Not to Bother

For code outside hot paths (startup, config parsing, rarely-called handlers), this optimization adds noise without measurable benefit — reach for it once profiling identifies an actual hot loop.

## See Also

- [perf-avoid-metatable-hot-path](perf-avoid-metatable-hot-path.md)
- [perf-profile-first](perf-profile-first.md)
- [perf-numeric-for](perf-numeric-for.md)
