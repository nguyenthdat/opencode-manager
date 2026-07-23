# meta-mixins

> Compose behavior via mixins instead of deep inheritance chains

## Why It Matters

Lua's `__index` supports single-parent chaining naturally, but real designs often need a type to gain behavior from several independent sources (e.g. "Serializable" + "Drawable" + "Damageable" for a game entity). Rather than forcing that into a fragile deep inheritance chain, copy or compose the needed methods directly onto the class table — a mixin.

## Bad

```lua
-- Forcing multiple concerns into a single inheritance chain
local Entity = {}
local Drawable = setmetatable({}, { __index = Entity })
local Damageable = setmetatable({}, { __index = Drawable })  -- unrelated concerns
                                                              -- forced into one chain
local Player = setmetatable({}, { __index = Damageable })
-- Player now depends on a chain that conflates drawing and damage handling
```

## Good

```lua
local function mixin(class, source)
  for name, fn in pairs(source) do
    class[name] = fn
  end
  return class
end

local Drawable = {
  draw = function(self) render(self.sprite, self.x, self.y) end,
}

local Damageable = {
  take_damage = function(self, amount) self.hp = self.hp - amount end,
  is_dead = function(self) return self.hp <= 0 end,
}

local Player = {}
Player.__index = Player
mixin(Player, Drawable)
mixin(Player, Damageable)

function Player.new(x, y)
  return setmetatable({ x = x, y = y, hp = 100, sprite = "player.png" }, Player)
end

local p = Player.new(0, 0)
p:draw()
p:take_damage(30)
```

## Trade-off

Mixins copy function references onto each class table, so a change to a mixin's table after composition won't retroactively affect classes that already mixed it in — re-run `mixin()` or keep mixin source tables stable before use. For dynamic/shared updates, use `__index` chaining instead; for independent composable concerns, mixins are usually clearer.

## See Also

- [meta-inheritance-chain](meta-inheritance-chain.md)
- [meta-index-inheritance](meta-index-inheritance.md)
- [meta-class-pattern](meta-class-pattern.md)
