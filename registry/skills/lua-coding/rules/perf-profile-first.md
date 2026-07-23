# perf-profile-first

> Profile before optimizing; let measurement pick which rule applies

## Why It Matters

Lua-specific micro-optimizations (caching globals as locals, avoiding metatable indirection, hoisting closures out of loops, choosing the numeric `for`) all trade code clarity for speed. Applied reflexively across an entire codebase, they add noise everywhere for a real benefit only in the small fraction of code that's actually hot. Profiling first (`os.clock()` timing, LuaJIT's `-jv`/`-jp` profiler output, a sampling profiler for the embedding host) tells you exactly where that fraction is, so the trade-off is only paid where it earns its keep.

## Bad

```lua
-- Applying every perf- rule in this skill to a config-loading function
-- that runs once at startup and takes 2 milliseconds either way
local floor, insert = math.floor, table.insert  -- pointless hoist: called once
local function load_config(path)
  local scratch = {}  -- reused "for performance" -- but this runs once ever
  ...
end
```

## Good

```lua
-- Measure first: a simple, portable timing harness
local function time_it(label, fn, ...)
  local start = os.clock()
  local result = fn(...)
  print(("%s: %.4fs"):format(label, os.clock() - start))
  return result
end

time_it("load_config", load_config, "app.lua")
time_it("simulate_frame", simulate_frame, world, dt)

-- Only after measurement shows simulate_frame() is the actual bottleneck
-- (called thousands of times per second) does it earn perf- treatment:
-- local sqrt = math.sqrt          -- hoisted: proven hot path
-- reuse a scratch table across calls -- proven hot path
-- avoid metatable indirection in the innermost loop -- proven hot path

-- load_config() stays simple and readable -- it was never the bottleneck
```

## LuaJIT-Specific Profiling

LuaJIT ships `-jv` (verbose JIT trace output, showing what got compiled/aborted) and `-jp` (a statistical profiler); use these to find where the JIT is failing to compile a hot loop before hand-optimizing Lua source around a guess.

```sh
luajit -jv script.lua    # see which loops got JIT-compiled vs. fell back to the interpreter
luajit -jp=vs script.lua # sampling profiler, sorted by time, with call stacks
```

## See Also

- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
- [perf-local-cache-globals](perf-local-cache-globals.md)
- [perf-gc-tuning](perf-gc-tuning.md)
