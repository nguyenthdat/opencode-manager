# anti-table-holes-length

> Anti-pattern: creating holes in an array table, then relying on `#`

## Why It Matters

Once a hole (a `nil` between non-nil integer indices) exists in a table, `#t` and `ipairs` behave in an implementation-defined way rather than a wrong-but-consistent way — meaning the exact same buggy code can appear to "work" on one Lua version/build and silently misbehave on another, making this bug class especially treacherous to reproduce.

## Bad

```lua
local players = { "alice", "bob", "carol" }

-- Removing a player by nil-ing their slot directly creates a hole
local function remove_player(name)
  for i, p in ipairs(players) do
    if p == name then
      players[i] = nil   -- creates a hole; #players is now unreliable
      break
    end
  end
end

remove_player("bob")
print(#players)  -- could be 1 or 3, implementation-defined -- do not rely on this
```

## Good

```lua
local players = { "alice", "bob", "carol" }

-- table.remove shifts subsequent elements down, never leaving a hole
local function remove_player(name)
  for i, p in ipairs(players) do
    if p == name then
      table.remove(players, i)
      return
    end
  end
end

remove_player("bob")
print(#players)  -- reliably 2
```

## See Also

- [table-no-holes](table-no-holes.md)
- [table-remove-vs-nil](table-remove-vs-nil.md)
- [table-length-operator](table-length-operator.md)
