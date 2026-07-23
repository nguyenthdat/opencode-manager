# err-xpcall-traceback

> Use `xpcall` with `debug.traceback` for diagnosable crash reports

## Why It Matters

`pcall` gives you the error value but the stack has already unwound by the time you see it, so you lose the call chain that led to the failure. `xpcall` runs a message handler *before* the stack unwinds, letting you capture a full traceback — essential for debugging errors in production logs where you can't attach a debugger.

## Bad

```lua
local ok, err = pcall(risky_operation)
if not ok then
  log.error(err)  -- just "file.lua:42: attempt to index a nil value" --
                   -- no idea what called risky_operation or how it got there
end
```

## Good

```lua
local ok, err = xpcall(risky_operation, debug.traceback)
if not ok then
  log.error(err)
  -- includes the full stack trace: every frame from risky_operation
  -- back up to the entry point, invaluable for diagnosing production bugs
end

-- xpcall also accepts extra arguments to forward to the protected function,
-- same as pcall does
local function divide(a, b)
  if b == 0 then error("division by zero") end
  return a / b
end

local ok, result = xpcall(divide, debug.traceback, 10, 0)
if not ok then
  log.error(result)
end
```

## Custom Message Handlers

A message handler can transform the error before it's returned, e.g. attaching structured context:

```lua
local function handler(err)
  return { message = tostring(err), traceback = debug.traceback(nil, 2) }
end

local ok, err_info = xpcall(risky_operation, handler)
if not ok then
  report_to_monitoring(err_info)
end
```

## See Also

- [err-pcall-protect](err-pcall-protect.md)
- [err-error-table](err-error-table.md)
- [err-propagate-context](err-propagate-context.md)
