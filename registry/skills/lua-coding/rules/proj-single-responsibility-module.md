# proj-single-responsibility-module

> Keep each module focused on one responsibility

## Why It Matters

A module that mixes unrelated concerns (HTTP client logic plus JSON parsing plus logging configuration) is harder to test in isolation, harder to reuse in a different context, and forces every consumer to pull in dependencies they may not need. Splitting along clear responsibility boundaries keeps each module's `require` graph small and its purpose obvious from its name.

## Bad

```lua
-- app.lua -- one module doing HTTP, JSON, logging, and business logic together
local M = {}

function M.log(msg) print(os.date() .. ": " .. msg) end
function M.parse_json(s) ... end
function M.http_get(url) ... end
function M.calculate_shipping(order) ... end
function M.render_invoice(order) ... end

return M
```

## Good

```lua
-- logger.lua
local M = {}
function M.log(msg) print(os.date() .. ": " .. msg) end
return M
```

```lua
-- json.lua
local M = {}
function M.parse(s) ... end
function M.encode(t) ... end
return M
```

```lua
-- http_client.lua
local M = {}
function M.get(url) ... end
return M
```

```lua
-- shipping.lua
local M = {}
function M.calculate(order) ... end
return M
```

```lua
-- app.lua -- composes the focused modules, doesn't reimplement their concerns
local logger = require("logger")
local http = require("http_client")
local shipping = require("shipping")

local function process_order(order)
  logger.log("processing order " .. order.id)
  local cost = shipping.calculate(order)
  ...
end
```

## See Also

- [proj-flat-small-project](proj-flat-small-project.md)
- [scope-module-pattern](scope-module-pattern.md)
- [proj-avoid-circular-require](proj-avoid-circular-require.md)
