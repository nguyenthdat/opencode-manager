# perf-string-rep-vs-concat

> Use `string.rep` for repeated-pattern building instead of loop concatenation

## Why It Matters

Building a string of N repeated copies of a substring via a loop of `..` concatenation is the same O(n²) trap as general string-building in a loop (see `perf-table-concat`), except here the fix is even simpler: `string.rep(s, n[, sep])` does exactly this in one optimized call, with no manual accumulation needed at all.

## Bad

```lua
-- Quadratic: repeated concatenation to build a simple repeated pattern
local function make_separator(width)
  local line = ""
  for _ = 1, width do
    line = line .. "-"
  end
  return line
end
```

## Good

```lua
-- Single call, no manual loop or accumulation needed
local function make_separator(width)
  return string.rep("-", width)
end

-- string.rep also supports a separator between repetitions
local csv_header = string.rep("col", 5, ",")  -- "col,col,col,col,col"

-- Combine with table.concat for more complex repeated structures that
-- string.rep alone can't express (varying content per repetition)
local function make_grid_row(cell_width, num_cells)
  local cells = {}
  for i = 1, num_cells do
    cells[i] = string.rep(" ", cell_width)
  end
  return table.concat(cells, "|")
end
```

## See Also

- [perf-table-concat](perf-table-concat.md)
- [perf-string-format-cache](perf-string-format-cache.md)
- [perf-avoid-table-in-loop](perf-avoid-table-in-loop.md)
