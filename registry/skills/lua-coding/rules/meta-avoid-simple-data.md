# meta-avoid-simple-data

> Don't attach metatables to simple plain-data tables

## Why It Matters

Metatables add an indirection cost to every field access/write that misses (and to every operator use) and make a value harder to serialize (JSON-encode, `table.concat`, deep-copy) generically. Plain configuration, DTOs, and data passed across a JSON/RPC boundary should stay plain tables — reserve metatables for values that genuinely need behavior (methods, operator overloading, inheritance).

## Bad

```lua
-- A metatable adds nothing here except overhead and serialization friction
local ConfigMeta = { __index = function() return nil end }

local function load_config(path)
  local data = dofile(path)
  return setmetatable(data, ConfigMeta)  -- pointless: plain data, no behavior
end

local config = load_config("app.lua")
json.encode(config)  -- generic JSON encoders often choke on unexpected metatables
```

## Good

```lua
-- Plain table -- no metatable, trivially serializable, no indirection
local function load_config(path)
  return dofile(path)
end

local config = load_config("app.lua")
json.encode(config)  -- works exactly as expected

-- Reserve metatables for types with actual behavior:
local ConfigValidator = {}
ConfigValidator.__index = ConfigValidator
function ConfigValidator.new(schema) return setmetatable({ schema = schema }, ConfigValidator) end
function ConfigValidator:validate(config) --[[ ... ]] end
```

## The Test to Apply

Ask: does this table need methods, operator overloading, or inherited defaults? If the honest answer is "no, it's just data," leave it as a plain table.

## See Also

- [meta-class-pattern](meta-class-pattern.md)
- [table-readonly-proxy](table-readonly-proxy.md)
- [anti-metatable-abuse-simple-data](anti-metatable-abuse-simple-data.md)
