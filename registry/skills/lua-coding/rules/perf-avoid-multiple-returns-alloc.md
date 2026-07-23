# perf-avoid-multiple-returns-alloc

> Avoid unnecessarily wrapping multiple return values in a table

## Why It Matters

Lua's multiple return values are passed on the VM stack directly, with no allocation — wrapping them in a table (`{ f() }`) to "bundle" them for convenience allocates a table that wasn't otherwise necessary, and (as with any table containing possible `nil`s) can silently truncate results at a hole.

## Bad

```lua
-- Wraps 3 plain return values into a table purely to pass them around,
-- allocating on every call where none was needed
local function get_position()
  return player.x, player.y, player.z
end

local function log_position()
  local pos = { get_position() }  -- unnecessary table allocation
  print(pos[1], pos[2], pos[3])
end
```

## Good

```lua
-- Just forward or destructure the multiple return values directly
local function get_position()
  return player.x, player.y, player.z
end

local function log_position()
  local x, y, z = get_position()  -- no allocation
  print(x, y, z)
end

-- Forwarding return values through another function: no allocation needed
local function get_position_logged()
  print("fetching position")
  return get_position()   -- tail call, forwards all 3 values directly
end
```

## When Bundling Genuinely Is Needed

If the values must be stored for later (put in a data structure, sent across a queue) rather than used immediately, a table is the right tool — the point is not to reach for one reflexively when a direct destructure/forward would do.

## See Also

- [fn-multiple-returns](fn-multiple-returns.md)
- [fn-tail-calls](fn-tail-calls.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
