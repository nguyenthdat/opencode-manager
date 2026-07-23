# perf-table-concat

> Use `table.concat` instead of repeated `..` concatenation in loops

## Why It Matters

Lua strings are immutable, so `s = s .. more` allocates an entirely new string every time, copying the whole accumulated content each iteration — an O(n²) pattern for building a string across n iterations. `table.concat` collects pieces into a table (O(1) append) and joins them in a single pass at the end (O(n) total).

## Bad

```lua
-- Quadratic: every iteration copies the entire string built so far
local function build_csv(rows)
  local csv = ""
  for _, row in ipairs(rows) do
    csv = csv .. row.id .. "," .. row.name .. "\n"  -- reallocates + copies every time
  end
  return csv
end
```

## Good

```lua
-- Linear: table.insert is O(1) amortized, table.concat joins once at the end
local function build_csv(rows)
  local parts = {}
  for _, row in ipairs(rows) do
    parts[#parts + 1] = row.id .. "," .. row.name
  end
  return table.concat(parts, "\n") .. "\n"
end

-- table.concat also accepts a range, useful for partial joins
local words = { "the", "quick", "brown", "fox" }
print(table.concat(words, " ", 2, 3))  -- "quick brown"
```

## When `..` Is Fine

A small, fixed number of concatenations (building one log line, one error message) is not a hot loop and `..` reads more naturally there — reserve `table.concat` for loops that accumulate many pieces.

```lua
local message = "Error in " .. filename .. " at line " .. line_number  -- fine, not a loop
```

## See Also

- [perf-string-rep-vs-concat](perf-string-rep-vs-concat.md)
- [perf-string-format-cache](perf-string-format-cache.md)
- [anti-tostring-concat](anti-tostring-concat.md)
