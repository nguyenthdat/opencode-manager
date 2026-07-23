# table-length-operator

> Treat `#t` as defined only for sequences without holes

## Why It Matters

The Lua manual explicitly leaves the result of `#t` as a "border" — any `n` where `t[n] ~= nil and t[n+1] == nil` — undefined when the table has holes. Different Lua versions and implementations (5.1 vs 5.4 vs LuaJIT) may pick a different valid border for the same non-sequence table. Code that assumes `#t` behaves like a language-level "array length" for arbitrary tables will occasionally break in a way that is very hard to reproduce.

## Bad

```lua
local items = {}
items[1] = "a"
items[3] = "c"     -- hole at index 2

print(#items)      -- could print 1 or 3, unspecified -- do not rely on this

-- Also risky: relying on # after removing an item by setting nil directly
local list = { "a", "b", "c" }
list[#list] = nil  -- happens to work here because it's the last element,
                    -- but is fragile if code elsewhere assumes a stable length
```

## Good

```lua
-- Keep an explicit count alongside a table that may have holes
local sparse = { count = 0, items = {} }

local function set(sparse_table, index, value)
  if sparse_table.items[index] == nil and value ~= nil then
    sparse_table.count = sparse_table.count + 1
  end
  sparse_table.items[index] = value
end

-- Or guarantee the table is always a true sequence and rely on # safely
local list = { "a", "b", "c" }
table.remove(list)   -- removes the last element, keeps it a sequence
print(#list)         -- 2, well-defined because there are no holes
```

## See Also

- [table-no-holes](table-no-holes.md)
- [table-array-vs-dict](table-array-vs-dict.md)
- [table-remove-vs-nil](table-remove-vs-nil.md)
