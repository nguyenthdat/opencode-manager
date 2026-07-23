# perf-reuse-tables

> Reuse and `clear()` tables instead of reallocating them every call

## Why It Matters

Allocating a fresh table on every call to a frequently invoked function generates garbage the collector must eventually reclaim. When a function is called very frequently with the same "shape" of temporary table each time (e.g. a per-frame scratch buffer, a reusable argument table), clearing and reusing one table amortizes the allocation cost to effectively zero after the first call.

## Bad

```lua
-- Allocates a brand-new table every single call
local function get_visible_entities(world, camera)
  local visible = {}
  for _, e in ipairs(world.entities) do
    if camera:can_see(e) then
      table.insert(visible, e)
    end
  end
  return visible
end
```

## Good

```lua
-- Reuse one scratch table across calls -- caller must treat the returned
-- table as valid only until the next call (documented clearly)
local scratch_visible = {}

local function get_visible_entities(world, camera)
  for i = #scratch_visible, 1, -1 do
    scratch_visible[i] = nil   -- clear without reallocating
  end
  for _, e in ipairs(world.entities) do
    if camera:can_see(e) then
      scratch_visible[#scratch_visible + 1] = e
    end
  end
  return scratch_visible
end

-- Usage: valid only until the next get_visible_entities() call
for _, e in ipairs(get_visible_entities(world, camera)) do
  render(e)
end
```

## The Trade-off: Document the Aliasing Contract

Reusing a table means the caller cannot hold onto the returned reference across calls without it changing underneath them — this trade-off (less garbage vs. an aliasing constraint) is only worth making in genuinely hot paths, and must be documented clearly at the function.

## See Also

- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [table-preallocate](table-preallocate.md)
- [table-nested-ownership](table-nested-ownership.md)
