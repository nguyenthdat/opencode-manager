# api-return-self-chaining

> Return `self` for chainable method calls where the idiom fits

## Why It Matters

For objects whose methods primarily configure state (builders, UI widget setup, query construction), returning `self` from each method lets callers chain calls fluently instead of repeating the object name on every line. This is the same idiom as Rust's/other languages' builder pattern, expressed through Lua's colon-syntax methods.

## Bad

```lua
local query = Query.new("users")
query:where("age", ">", 18)
query:order_by("name")
query:limit(10)
local results = query:execute()
```

## Good

```lua
local Query = {}
Query.__index = Query

function Query.new(table_name)
  return setmetatable({ table_name = table_name, conditions = {}, limit_n = nil }, Query)
end

function Query:where(field, op, value)
  table.insert(self.conditions, { field, op, value })
  return self   -- enables chaining
end

function Query:order_by(field)
  self.order_field = field
  return self
end

function Query:limit(n)
  self.limit_n = n
  return self
end

function Query:execute()
  return run_query(self)
end

local results = Query.new("users")
  :where("age", ">", 18)
  :order_by("name")
  :limit(10)
  :execute()
```

## When Not to Chain

Don't return `self` from methods whose natural return value is something else (a computed result, a boolean, a different object) — chaining only makes sense for methods whose job is purely to mutate configuration/state and hand control back.

## See Also

- [meta-class-pattern](meta-class-pattern.md)
- [api-options-table](api-options-table.md)
- [meta-new-constructor](meta-new-constructor.md)
