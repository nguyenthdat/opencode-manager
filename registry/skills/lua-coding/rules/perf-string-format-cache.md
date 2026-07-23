# perf-string-format-cache

> Avoid recompiling format strings/patterns inside loops

## Why It Matters

`string.format`'s format string and `string.match`/`gmatch`/`gsub`'s pattern are parsed fresh on every call — there is no automatic pattern cache in standard Lua. Building the same format string or pattern from concatenated pieces inside a loop repeats that parsing work on every iteration for no benefit, when it could be constructed once outside the loop.

## Bad

```lua
-- Rebuilds the format string via concatenation on every single call
local function log_entries(entries, prefix)
  for _, entry in ipairs(entries) do
    print(string.format(prefix .. ": %s at %d", entry.message, entry.timestamp))
  end
end

-- Rebuilding a dynamic pattern every iteration when it never changes
local function count_matches(lines, word)
  local pattern = "%f[%a]" .. word .. "%f[%A]"
  local count = 0
  for _, line in ipairs(lines) do
    for _ in line:gmatch(pattern) do count = count + 1 end  -- fine, built outside loop --
  end                                                          -- but if pattern were built
  return count                                                -- INSIDE the loop, it'd repeat work
end
```

## Good

```lua
-- Build the format string once, outside the loop
local function log_entries(entries, prefix)
  local fmt = prefix .. ": %s at %d"
  for _, entry in ipairs(entries) do
    print(string.format(fmt, entry.message, entry.timestamp))
  end
end

-- Pattern built once, reused every iteration -- this was already correct above,
-- shown here as the pattern to follow deliberately
local function count_matches(lines, word)
  local pattern = "%f[%a]" .. word .. "%f[%A]"  -- built once
  local count = 0
  for _, line in ipairs(lines) do
    for _ in line:gmatch(pattern) do count = count + 1 end
  end
  return count
end
```

## See Also

- [perf-table-concat](perf-table-concat.md)
- [perf-avoid-select-hash](perf-avoid-select-hash.md)
- [perf-string-rep-vs-concat](perf-string-rep-vs-concat.md)
