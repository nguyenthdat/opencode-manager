# table-no-holes

> Never leave `nil` holes in the middle of an array-part table

## Why It Matters

The `#` operator and `ipairs` are only well-defined for "sequences" — tables whose keys are `1..n` with no `nil` in between. Assigning `nil` into the middle of an array (or skipping an index) creates a hole; from that point on `#t` may return any "border" the implementation picks, and `ipairs` silently stops at the first hole. Bugs from holes are notoriously hard to spot because the table looks fine when printed with `pairs`.

## Bad

```lua
local queue = { "a", "b", "c", "d" }

-- Removing by nil-ing out the middle creates a hole
queue[2] = nil
print(#queue)                -- could be 4, or 1 — undefined for tables with holes
for i, v in ipairs(queue) do print(i, v) end  -- stops after "a", never sees c/d
```

## Good

```lua
local queue = { "a", "b", "c", "d" }

-- Use table.remove to shift subsequent elements down, keeping it a sequence
table.remove(queue, 2)
print(#queue)                 -- 3, reliable
for i, v in ipairs(queue) do print(i, v) end  -- a, c, d

-- Or, if order doesn't matter and holes are unavoidable, use a sentinel
-- and skip it explicitly instead of nil-ing it out
local NONE = setmetatable({}, { __tostring = function() return "<none>" end })
local slots = { "a", NONE, "c", "d" }
for i, v in ipairs(slots) do
  if v ~= NONE then process(v) end
end
```

## When Holes Are Unavoidable

Sparse tables indexed by external IDs (e.g. entity IDs in a game, socket file descriptors) are legitimately non-sequences. In that case, don't use `#`/`ipairs` at all — iterate with `pairs` and treat the table purely as a map, or track a separate count/max-index field.

## See Also

- [table-array-vs-dict](table-array-vs-dict.md)
- [table-length-operator](table-length-operator.md)
- [table-remove-vs-nil](table-remove-vs-nil.md)
