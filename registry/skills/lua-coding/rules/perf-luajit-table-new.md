# perf-luajit-table-new

> Use `table.new` (LuaJIT extension) to preallocate array/hash parts

## Why It Matters

LuaJIT ships an extension module, `table.new(narray, nhash)`, that preallocates a table's internal array and hash parts up front — avoiding the repeated rehash-and-grow cycle that happens when a table is built by inserting elements one at a time from empty. This is LuaJIT-specific and not present in vanilla PUC-Lua at all.

## Bad

```lua
-- On LuaJIT, building a large result table from empty triggers several
-- internal rehashes as it grows past each capacity threshold
local function build(n)
  local t = {}
  for i = 1, n do
    t[i] = compute(i)
  end
  return t
end
```

## Good

```lua
-- LuaJIT only
local new_tab = require("table.new")

local function build(n)
  local t = new_tab(n, 0)  -- n array slots preallocated, 0 hash slots
  for i = 1, n do
    t[i] = compute(i)
  end
  return t
end

-- Preallocating hash slots too, for a table that mixes a known sequence
-- part with a known number of named fields
local function build_record(n, field_count)
  local t = new_tab(n, field_count)
  for i = 1, n do t[i] = compute(i) end
  t.count = n
  return t
end
```

## Portable Fallback

```lua
-- Guard the require so the same module still loads (without the optimization)
-- on vanilla PUC-Lua targets
local ok, new_tab = pcall(require, "table.new")
if not ok then
  new_tab = function(_, _) return {} end
end
```

## See Also

- [table-preallocate](table-preallocate.md)
- [embed-luajit-vs-plain](embed-luajit-vs-plain.md)
- [perf-luajit-ffi](perf-luajit-ffi.md)
