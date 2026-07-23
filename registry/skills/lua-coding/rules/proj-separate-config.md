# proj-separate-config

> Separate configuration data from logic modules

## Why It Matters

Mixing hardcoded configuration values into logic-heavy modules makes it impossible to change environment-specific settings (dev vs. prod URLs, timeouts, feature flags) without editing and redeploying code — a dedicated config module (or a Lua table returned from a `config.lua`) keeps the two concerns cleanly separable and makes config the one place to look for tunable values.

## Bad

```lua
-- api_client.lua -- configuration values scattered throughout the logic
local function fetch_user(id)
  return http.get("https://api-prod.example.com/v2/users/" .. id, { timeout = 30 })
end

local function fetch_orders(user_id)
  return http.get("https://api-prod.example.com/v2/orders?user=" .. user_id, { timeout = 45 })
end
```

## Good

```lua
-- config.lua -- one place for tunable values, easy to override per environment
return {
  api_base_url = os.getenv("API_BASE_URL") or "https://api-prod.example.com",
  api_version = "v2",
  default_timeout = 30,
}
```

```lua
-- api_client.lua -- logic references config, doesn't hardcode values
local config = require("config")

local function fetch_user(id)
  local url = config.api_base_url .. "/" .. config.api_version .. "/users/" .. id
  return http.get(url, { timeout = config.default_timeout })
end
```

## Environment-Specific Config Files

```lua
-- config.dev.lua / config.prod.lua, selected at startup
local env = os.getenv("APP_ENV") or "dev"
local config = require("config." .. env)
```

## See Also

- [api-init-function](api-init-function.md)
- [table-readonly-proxy](table-readonly-proxy.md)
- [proj-single-responsibility-module](proj-single-responsibility-module.md)
