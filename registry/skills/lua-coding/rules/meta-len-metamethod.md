# meta-len-metamethod

> Use `__len` (Lua 5.2+) to customize the behavior of `#` on tables

## Why It Matters

Since Lua 5.2, tables can define `__len` to override what the `#` operator returns — useful for custom collection types that track their length explicitly (e.g. a queue that also holds non-sequence metadata, or a "virtual" collection backed by something else entirely). Lua 5.1 does not support `__len` on tables at all (only on userdata), so this is a version-sensitive feature.

## Bad

```lua
-- Queue mixes sequence data with metadata fields, so # is unreliable (see
-- table-array-vs-dict) -- and there's no way to fix that on Lua 5.1/plain tables
local Queue = { items = { "a", "b", "c" }, capacity = 10 }
print(#Queue)  -- meaningless: Queue itself isn't a sequence
```

## Good

```lua
-- Lua 5.2+: define __len so # on the Queue object reports the item count
local Queue = {}
Queue.__index = Queue
Queue.__len = function(self) return #self.items end

function Queue.new(capacity)
  return setmetatable({ items = {}, capacity = capacity }, Queue)
end

function Queue:push(v)
  table.insert(self.items, v)
end

local q = Queue.new(10)
q:push("a")
q:push("b")
print(#q)   -- 2, thanks to __len -- Queue.capacity doesn't interfere

-- Lua 5.1 / LuaJIT (which follows 5.1 semantics): __len is ignored for
-- tables, so expose length via an explicit method instead
function Queue:length()
  return #self.items
end
```

## See Also

- [table-length-operator](table-length-operator.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
- [meta-operator-overload](meta-operator-overload.md)
