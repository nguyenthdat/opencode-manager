# anti-os-exit-library

> Anti-pattern: calling `os.exit()` from library code

## Why It Matters

`os.exit()` terminates the entire process immediately — completely inappropriate for a library function to call, since it robs the calling application of any chance to catch the error, clean up resources, log the failure meaningfully, or decide for itself that the condition isn't actually fatal. Only the top-level application (the `main.lua`/entry-point script) should ever decide the process should exit.

## Bad

```lua
-- config_loader.lua -- a library that kills the WHOLE process on any error,
-- even if the calling application would have preferred to retry or fall
-- back to defaults
local M = {}

function M.load(path)
  local file = io.open(path, "r")
  if not file then
    print("fatal: config file not found: " .. path)
    os.exit(1)   -- the embedding application never gets a say in this
  end
  return dofile(path)
end

return M
```

## Good

```lua
-- config_loader.lua -- reports failure through the normal (nil, err) convention;
-- lets the CALLER decide what "config missing" should mean for them
local M = {}

function M.load(path)
  local file = io.open(path, "r")
  if not file then
    return nil, "config file not found: " .. path
  end
  file:close()
  return dofile(path)
end

return M
```

```lua
-- main.lua -- the application entry point is the ONLY place that decides
-- to exit, and can choose a fallback instead if that's more appropriate
local config, err = require("config_loader").load("app.lua")
if not config then
  io.stderr:write("fatal: " .. err .. "\n")
  os.exit(1)   -- appropriate HERE, at the top level, not inside the library
end
```

## See Also

- [err-nil-err-pattern](err-nil-err-pattern.md)
- [err-error-vs-return-nil](err-error-vs-return-nil.md)
- [api-avoid-side-effects-on-require](api-avoid-side-effects-on-require.md)
