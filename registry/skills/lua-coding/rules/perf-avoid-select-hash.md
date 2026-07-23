# perf-avoid-select-hash

> Avoid string-keyed dispatch in hot paths; use numeric/table lookup instead

## Why It Matters

String-keyed table lookups hash the string on every access; for a dispatch happening millions of times per second (a bytecode interpreter's opcode dispatch, a per-frame per-entity type check in a game), an integer-keyed lookup (or, better, a direct array index) avoids that hashing cost and benefits more from LuaJIT's array-part optimizations.

## Bad

```lua
-- Every entity's type dispatch hashes a string key, every frame, per entity
local handlers = {
  player = update_player,
  enemy = update_enemy,
  projectile = update_projectile,
}

local function update_all(entities, dt)
  for _, e in ipairs(entities) do
    handlers[e.type](e, dt)   -- e.type is a string; hashed on every lookup
  end
end
```

## Good

```lua
-- Assign small integer type IDs once at entity creation; dispatch by
-- integer index into an array-part table -- cheaper lookup, especially
-- under LuaJIT where array-part access is highly optimized
local ENTITY_TYPE = { PLAYER = 1, ENEMY = 2, PROJECTILE = 3 }

local handlers = {
  [ENTITY_TYPE.PLAYER] = update_player,
  [ENTITY_TYPE.ENEMY] = update_enemy,
  [ENTITY_TYPE.PROJECTILE] = update_projectile,
}

local function update_all(entities, dt)
  for _, e in ipairs(entities) do
    handlers[e.type_id](e, dt)   -- integer key: cheaper lookup, array-part storage
  end
end

local function new_enemy()
  return { type_id = ENTITY_TYPE.ENEMY, hp = 100 }
end
```

## Profile First

This is a genuinely micro-level optimization — apply it only in code that profiling has identified as a real hot path (e.g. per-frame entity dispatch in a game engine), not preemptively across an entire codebase.

## See Also

- [fn-first-class-functions](fn-first-class-functions.md)
- [anti-string-dispatch](anti-string-dispatch.md)
- [perf-profile-first](perf-profile-first.md)
