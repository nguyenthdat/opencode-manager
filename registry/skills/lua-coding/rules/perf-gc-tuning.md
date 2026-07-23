# perf-gc-tuning

> Tune the garbage collector for latency-sensitive code

## Why It Matters

Lua's incremental (or, since 5.4, optionally generational) garbage collector runs its work in small steps interleaved with your program, but its default pacing is tuned for general-purpose throughput, not for the strict per-frame latency budgets a game or a low-latency service needs. `collectgarbage` exposes tuning parameters (and, in 5.4, a whole alternate generational mode) to reduce GC-induced stutter.

## Bad

```lua
-- Never touching GC settings, then wondering why frame times spike
-- periodically as the collector reclaims a big batch of garbage all at once
local function game_loop()
  while running do
    update(dt)
    draw()
  end
end
```

## Good

```lua
-- Lua 5.4: switch to the generational collector, which is often better
-- suited to workloads with lots of short-lived garbage (typical of games)
collectgarbage("generational")

-- Or, on any version, tune the incremental collector's pacing:
-- pause: how long to wait after a cycle before starting the next (percent)
-- stepmul: how aggressively each incremental step reclaims memory (percent)
collectgarbage("incremental", 110, 1000)

-- For a hard per-frame latency budget, do bounded incremental steps
-- yourself instead of letting the collector decide when to run:
local function game_loop()
  while running do
    update(dt)
    draw()
    collectgarbage("step", 1)  -- do a small bounded amount of GC work per frame
  end
end
```

## Measure Before Tuning

GC tuning trades memory for latency (or vice versa) — always measure actual frame times / allocation rates before and after a change; the "right" pacing is workload-specific and what helps one game/service can hurt another.

## See Also

- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [meta-weak-tables](meta-weak-tables.md)
- [embed-game-engine-hot-reload](embed-game-engine-hot-reload.md)
