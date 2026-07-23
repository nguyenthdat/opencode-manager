# anti-metatable-abuse-simple-data

> Anti-pattern: attaching a metatable to a plain-data table for no behavioral reason

## Why It Matters

A metatable on a table that has no methods, no operator overloading, and no inheritance need adds indirection cost and serialization friction for zero benefit — it's a sign the code reached for "OOP machinery" out of habit rather than because the data actually needed behavior.

## Bad

```lua
-- A metatable that does literally nothing except exist
local RecordMeta = {}

local function new_record(id, name)
  return setmetatable({ id = id, name = name }, RecordMeta)
end

-- Generic serializers/inspectors now have to account for an unexpected
-- metatable on what is otherwise completely plain data
local record = new_record(1, "Alice")
print(vim.inspect(record))  -- may print differently or need special handling
                              -- purely because of an unused metatable
```

## Good

```lua
-- Plain table: no metatable, trivially serializable, no indirection cost
local function new_record(id, name)
  return { id = id, name = name }
end

local record = new_record(1, "Alice")
print(vim.inspect(record))  -- behaves exactly as expected for plain data
```

## The Test

Before adding `setmetatable`, ask: does this value need methods (`__index`), operator overloading (`__add`, `__eq`), custom string conversion (`__tostring`), or inheritance? If none of these apply, it's plain data — leave it as a plain table.

## See Also

- [meta-avoid-simple-data](meta-avoid-simple-data.md)
- [table-readonly-proxy](table-readonly-proxy.md)
- [meta-class-pattern](meta-class-pattern.md)
