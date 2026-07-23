# perf-avoid-table-in-loop

> Avoid allocating new tables inside hot loops

## Why It Matters

Each `{}` literal (or `table.pack`, or an implicit table from `{...}`) inside a loop body allocates fresh memory and generates garbage-collection pressure. In a loop that runs every frame (games) or per-request (servers), unnecessary per-iteration table allocation is one of the most common, easily fixed sources of GC-induced latency spikes.

## Bad

```lua
-- Allocates a new table every single frame, purely to pass two numbers
local function update(dt)
  for _, entity in ipairs(entities) do
    local delta = { dx = entity.vx * dt, dy = entity.vy * dt }  -- allocation!
    entity.x = entity.x + delta.dx
    entity.y = entity.y + delta.dy
  end
end
```

## Good

```lua
-- No allocation: use local numbers instead of wrapping them in a table
local function update(dt)
  for _, entity in ipairs(entities) do
    local dx = entity.vx * dt
    local dy = entity.vy * dt
    entity.x = entity.x + dx
    entity.y = entity.y + dy
  end
end

-- If a table genuinely must be produced per-iteration (e.g. building a
-- result list), reuse a single scratch table instead of allocating fresh:
local scratch = {}
local function process_batch(items)
  for _, item in ipairs(items) do
    for k in pairs(scratch) do scratch[k] = nil end  -- clear, don't reallocate
    scratch.id = item.id
    scratch.score = compute_score(item)
    handle(scratch)  -- consumer must not retain a reference to `scratch`!
  end
end
```

## Caveat on Scratch-Table Reuse

Only reuse a scratch table when the consumer processes it synchronously and doesn't store a reference — if any code holds onto the table past the current iteration, reuse will corrupt it on the next iteration.

## See Also

- [table-preallocate](table-preallocate.md)
- [fn-no-closures-hot-loop](fn-no-closures-hot-loop.md)
- [perf-reuse-tables](perf-reuse-tables.md)
