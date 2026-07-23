# embed-love2d-callbacks

> Structure LÖVE games around the `love.load`/`update`/`draw` callback contract

## Why It Matters

LÖVE (a popular Lua/LuaJIT 2D game framework) drives the entire game loop by calling a fixed set of globally-defined callback functions (`love.load`, `love.update(dt)`, `love.draw`, `love.keypressed`, ...) that you define in `main.lua` — the engine calls them, you never call them yourself. Not understanding this contract (e.g. trying to write your own `while true do` game loop, or putting expensive one-time setup inside `love.update`) breaks the engine's timing, input handling, and rendering pipeline.

## Bad

```lua
-- main.lua -- fighting the engine's own loop instead of using its callbacks
function love.load()
  while true do                    -- WRONG: LÖVE already runs the main loop;
    update_game()                  -- this blocks forever and LÖVE never
    love.graphics.present()        -- gets to call update/draw/handle input at all
  end
end

function love.update(dt)
  player_sprite = love.graphics.newImage("player.png")  -- reloading every frame!
end
```

## Good

```lua
-- main.lua
local player

function love.load()
  -- one-time setup: runs once when the game starts
  player = { x = 0, y = 0, sprite = love.graphics.newImage("player.png") }
end

function love.update(dt)
  -- called every frame with the elapsed time (dt) since the last frame;
  -- update game state here, using dt for frame-rate-independent movement
  if love.keyboard.isDown("right") then
    player.x = player.x + 200 * dt
  end
end

function love.draw()
  -- called every frame after update; only rendering here, no state mutation
  love.graphics.draw(player.sprite, player.x, player.y)
end

function love.keypressed(key)
  if key == "escape" then
    love.event.quit()
  end
end
```

## See Also

- [name-event-handler-on](name-event-handler-on.md)
- [embed-game-engine-hot-reload](embed-game-engine-hot-reload.md)
- [perf-gc-tuning](perf-gc-tuning.md)
