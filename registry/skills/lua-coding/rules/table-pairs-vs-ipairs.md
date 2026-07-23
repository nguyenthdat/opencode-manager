# table-pairs-vs-ipairs

> Use `ipairs` for sequences, `pairs` for maps — never guess

## Why It Matters

`ipairs` iterates `1..n` in order and stops at the first `nil`; it is defined only for sequences. `pairs` iterates every key in the table (array and hash parts) in an *unspecified* order that can change between runs or Lua versions. Using the wrong one either silently drops data (`ipairs` on a map-like table) or produces non-deterministic output (`pairs` where order matters).

## Bad

```lua
local scores = { 10, 20, 30 }
scores.bonus = 5   -- now scores is not a pure sequence

-- ipairs silently ignores "bonus" -- easy to think this is fine, it's a trap
for i, v in ipairs(scores) do
  total = total + v
end

-- Using pairs where order matters produces flaky output
local steps = { "compile", "test", "deploy" }
for _, step in pairs(steps) do
  print(step)  -- order not guaranteed across Lua implementations
end
```

## Good

```lua
-- Pure sequence: use ipairs, and keep it a pure sequence
local scores = { 10, 20, 30 }
local total = 0
for _, v in ipairs(scores) do
  total = total + v
end

-- Metadata goes in a separate table or a wrapper, not mixed into the sequence
local scoreboard = { values = { 10, 20, 30 }, bonus = 5 }

-- Order matters: always use ipairs/numeric for, never pairs
local steps = { "compile", "test", "deploy" }
for _, step in ipairs(steps) do
  print(step)
end

-- Order doesn't matter, arbitrary keys: pairs is correct
local settings = { verbose = true, retries = 3, name = "ci" }
for key, value in pairs(settings) do
  print(key, value)
end
```

## See Also

- [table-array-vs-dict](table-array-vs-dict.md)
- [table-no-holes](table-no-holes.md)
- [anti-pairs-order-dependent](anti-pairs-order-dependent.md)
