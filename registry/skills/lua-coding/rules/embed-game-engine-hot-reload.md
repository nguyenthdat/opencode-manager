# embed-game-engine-hot-reload

> Design for script hot-reload; avoid stale closures/state across reloads

## Why It Matters

Many game engines (and Neovim plugin dev workflows) support reloading a Lua script's code without restarting the whole process, for fast iteration. If module-level state and closures aren't designed with this in mind, a reload can leave stale closures referencing an old version of a table, or duplicate event-handler registrations that were never cleaned up from the previous load — both classic "works until you hot-reload twice" bugs.

## Bad

```lua
-- game_logic.lua -- registers an event handler every time this module loads,
-- with no way to remove the PREVIOUS handler on a hot reload
local function on_collision(a, b)
  handle_collision(a, b)
end

event_bus.subscribe("collision", on_collision)
-- Reloading this file re-subscribes AGAIN, so after N reloads, N duplicate
-- handlers all fire for the same collision event
```

## Good

```lua
-- game_logic.lua -- unsubscribe any previous handler before re-subscribing,
-- using a stable, well-known key so reloads replace rather than duplicate
local HANDLER_KEY = "game_logic.on_collision"

local function on_collision(a, b)
  handle_collision(a, b)
end

event_bus.unsubscribe(HANDLER_KEY)              -- safe no-op on first load
event_bus.subscribe(HANDLER_KEY, on_collision)  -- always exactly one handler

-- For persistent game state that must SURVIVE a reload (player position,
-- score), store it outside the reloaded module (a separate, stable
-- "world state" table/module) rather than as a module-local upvalue that
-- gets reset to its initial value every time the module is re-required
local world_state = require("world_state")  -- not reloaded on hot-reload
world_state.player.score = world_state.player.score  -- preserved across reloads
```

## See Also

- [meta-weak-tables](meta-weak-tables.md)
- [proj-avoid-circular-require](proj-avoid-circular-require.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
