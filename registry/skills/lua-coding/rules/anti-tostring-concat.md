# anti-tostring-concat

> Anti-pattern: relying on implicit coercion in `..` for non-string/number values

## Why It Matters

The `..` (concat) operator only auto-coerces *numbers* to strings implicitly; concatenating anything else (a table, `nil`, a boolean) raises a runtime error rather than silently calling `tostring()` for you — code that "happens to work" during testing with number/string values will crash the moment it's exercised with a `nil` or a table value.

## Bad

```lua
local function log(prefix, value)
  print(prefix .. ": " .. value)  -- crashes if `value` is nil, a table, or a boolean
end

log("result", nil)
-- error: attempt to concatenate a nil value (local 'value')

log("config", { debug = true })
-- error: attempt to concatenate a table value (local 'value')
```

## Good

```lua
local function log(prefix, value)
  print(prefix .. ": " .. tostring(value))  -- always safe: tostring handles any type
end

log("result", nil)              -- "result: nil"
log("config", { debug = true })  -- "config: table: 0x55..." (or a custom __tostring)

-- For tables you want to print meaningfully, give them a __tostring
-- metamethod (see meta-tostring) rather than relying on the default
-- "table: 0x..." representation
```

## See Also

- [meta-tostring](meta-tostring.md)
- [perf-table-concat](perf-table-concat.md)
- [anti-type-coercion-surprises](anti-type-coercion-surprises.md)
