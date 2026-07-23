# anti-require-side-effects

> Anti-pattern: modules with heavy side effects at `require()` time

## Why It Matters

`require` is supposed to be safe to call speculatively, multiple times (it's cached, so subsequent calls are cheap), and in any order relative to other modules — a module that opens sockets, spawns processes, or does expensive I/O the instant it's `require`d breaks all three of those assumptions and makes load order silently matter.

## Bad

```lua
-- metrics.lua -- starts a background timer and opens a network connection
-- the INSTANT this file is required, regardless of whether the caller
-- actually wants metrics collection active yet
local socket = connect_to_metrics_server()  -- runs at require() time
local timer = start_periodic_flush(socket)   -- also runs immediately

local M = {}
function M.record(name, value) ... end
return M
```

```lua
-- Some unrelated test file does this just to reuse one small helper
-- function, and unexpectedly opens a real network connection as a side
-- effect, slowing down and potentially failing the entire test suite:
local metrics = require("metrics")  -- oops, connected to a real server
```

## Good

```lua
-- metrics.lua -- purely defines exports; nothing runs until explicitly started
local M = { socket = nil, timer = nil }

function M.start()
  M.socket = connect_to_metrics_server()
  M.timer = start_periodic_flush(M.socket)
end

function M.record(name, value) ... end

return M
```

```lua
-- main.lua -- side effects happen only when explicitly, deliberately triggered
local metrics = require("metrics")
metrics.start()
```

## See Also

- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
- [api-init-function](api-init-function.md)
- [proj-avoid-circular-require](proj-avoid-circular-require.md)
