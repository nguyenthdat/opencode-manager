# anti-pairs-order-dependent

> Anti-pattern: relying on `pairs()` iteration order

## Why It Matters

The Lua manual explicitly leaves the order `pairs()` visits table entries in as unspecified — it can differ across Lua versions, across implementations (PUC-Lua vs. LuaJIT), and even across runs of the same program for the same table, depending on internal hash bucket placement. Code that depends on a particular order "happening to work" is fragile and will eventually break, often only after an unrelated Lua version upgrade.

## Bad

```lua
local steps = {}
steps["1_compile"] = true
steps["2_test"] = true
steps["3_deploy"] = true

-- Assumes pairs() will visit these in the order they were inserted,
-- or in some other predictable order -- neither is guaranteed
for name in pairs(steps) do
  print(name)   -- order NOT guaranteed to be 1_compile, 2_test, 3_deploy
end
```

## Good

```lua
-- Use a sequence (array-part table) when order matters, with ipairs
local steps = { "compile", "test", "deploy" }
for _, name in ipairs(steps) do
  print(name)   -- guaranteed order: compile, test, deploy
end

-- If a name -> value map is genuinely needed alongside ordering, keep the
-- order in a separate sequence and use the map just for lookups
local step_order = { "compile", "test", "deploy" }
local step_status = { compile = "done", test = "done", deploy = "pending" }

for _, name in ipairs(step_order) do
  print(name, step_status[name])
end
```

## See Also

- [table-pairs-vs-ipairs](table-pairs-vs-ipairs.md)
- [table-array-vs-dict](table-array-vs-dict.md)
- [embed-preserve-target-version](embed-preserve-target-version.md)
