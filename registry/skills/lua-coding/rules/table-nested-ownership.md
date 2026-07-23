# table-nested-ownership

> Keep clear ownership of nested tables; avoid ambiguous shared mutable references

## Why It Matters

Because assignment aliases tables rather than copying them, it's easy to end up with a nested table referenced from multiple places without anyone being sure who "owns" it (i.e. who may safely mutate it). This produces spooky-action-at-a-distance bugs where changing one entity's data changes another's.

## Bad

```lua
local default_inventory = { potion = 3, sword = 1 }

-- Every new player accidentally shares the SAME inventory table
local function new_player(name)
  return { name = name, inventory = default_inventory }
end

local alice = new_player("Alice")
local bob = new_player("Bob")
alice.inventory.potion = 0   -- Bob's inventory.potion is now 0 too!
```

## Good

```lua
local function default_inventory()
  return { potion = 3, sword = 1 }   -- fresh table every call
end

local function new_player(name)
  return { name = name, inventory = default_inventory() }
end

local alice = new_player("Alice")
local bob = new_player("Bob")
alice.inventory.potion = 0
print(bob.inventory.potion)  -- still 3, independent tables

-- When sharing IS intentional (e.g. a shared read-only asset table),
-- name it and document it clearly so ownership is unambiguous:
local SHARED_ICON_ATLAS = load_atlas("icons.png")  -- intentionally shared, read-only
local function new_sprite(icon_name)
  return { atlas = SHARED_ICON_ATLAS, icon = icon_name }  -- shared on purpose
end
```

## See Also

- [table-shallow-vs-deepcopy](table-shallow-vs-deepcopy.md)
- [anti-deep-nested-mutation](anti-deep-nested-mutation.md)
- [anti-global-state-mutation](anti-global-state-mutation.md)
