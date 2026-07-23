# name-screaming-constants

> Use `SCREAMING_SNAKE_CASE` for constants

## Why It Matters

Lua has no `const` keyword before 5.4's `<const>` attribute, and even that doesn't apply to table fields — so naming is the primary signal readers have that a value is meant to be a fixed constant rather than ordinary mutable state. This convention is shared with most C-family languages and is instantly recognizable.

## Bad

```lua
local maxRetries = 3       -- looks like a regular mutable variable
local timeout = 30
local apiBaseUrl = "https://api.example.com"
```

## Good

```lua
local MAX_RETRIES = 3
local TIMEOUT_SECONDS = 30
local API_BASE_URL = "https://api.example.com"

-- Lua 5.4: pair the naming convention with <const> for a real guarantee
local MAX_RETRIES <const> = 3

-- Constants grouped in a module table also use SCREAMING_SNAKE_CASE keys
local Limits = {
  MAX_RETRIES = 3,
  TIMEOUT_SECONDS = 30,
  MAX_PAYLOAD_BYTES = 1024 * 1024,
}
```

## See Also

- [scope-const-attribute](scope-const-attribute.md)
- [table-readonly-proxy](table-readonly-proxy.md)
- [name-snake-case-funcs](name-snake-case-funcs.md)
