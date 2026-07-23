# api-init-function

> Provide an explicit `setup()`/`init()` function instead of implicit configuration

## Why It Matters

An explicit initialization function gives callers one clear, documented place to pass configuration and gives you one clear place to validate it, set defaults, and perform first-time setup — instead of implicitly configuring behavior via ad hoc global variables set before `require`, which is fragile and undocumented. This is the dominant convention in the Neovim plugin ecosystem (`require("plugin").setup({ ... })`).

## Bad

```lua
-- Implicit configuration via a magic global that must be set BEFORE requiring
MY_PLUGIN_TIMEOUT = 5000   -- undocumented, easy to forget, order-dependent

local plugin = require("my_plugin")  -- reads the global internally, silently
```

## Good

```lua
-- my_plugin.lua
local M = { config = { timeout = 3000, log_level = "info" } }

function M.setup(opts)
  opts = opts or {}
  M.config.timeout = opts.timeout or M.config.timeout
  M.config.log_level = opts.log_level or M.config.log_level
  M._initialized = true
end

function M.do_thing()
  assert(M._initialized, "call require('my_plugin').setup() first")
  ...
end

return M
```

```lua
-- caller.lua -- order-independent, self-documenting, explicit
require("my_plugin").setup({ timeout = 5000, log_level = "debug" })
```

## Neovim Convention

Nearly every modern Neovim plugin follows exactly this shape: `require("plugin_name").setup(opts)` as the one blessed entry point, called once from the user's config.

## See Also

- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
- [embed-neovim-lazy-plugin](embed-neovim-lazy-plugin.md)
- [api-options-table](api-options-table.md)
