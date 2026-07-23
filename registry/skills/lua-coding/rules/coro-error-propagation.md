# coro-error-propagation

> Propagate errors from `coroutine.resume`'s second return value explicitly

## Why It Matters

`coroutine.resume` never lets an error inside the coroutine crash the caller directly — instead it returns `false` plus the error value as its first two results. Ignoring the boolean success flag means an error inside a coroutine is silently swallowed, and the caller has no idea the coroutine failed instead of legitimately finishing.

## Bad

```lua
local co = coroutine.create(function()
  local data = fetch_data()  -- suppose this errors
  coroutine.yield(process(data))
end)

local _, value = coroutine.resume(co)
-- If fetch_data() errored, `value` IS the error message, but nothing here
-- distinguishes that from a legitimate yielded value -- silent misinterpretation
use(value)
```

## Good

```lua
local co = coroutine.create(function()
  local data = fetch_data()
  coroutine.yield(process(data))
end)

local ok, value_or_err = coroutine.resume(co)
if not ok then
  log.error("coroutine failed: " .. tostring(value_or_err))
  return
end
use(value_or_err)

-- With xpcall-style traceback captured from inside the coroutine body,
-- for richer diagnostics (wrap the coroutine's function to add xpcall):
local function safe_coroutine(fn)
  return coroutine.create(function(...)
    local ok, err = xpcall(fn, debug.traceback, ...)
    if not ok then
      error(err, 0)  -- re-raise so coroutine.resume still reports ok=false
    end
  end)
end
```

## See Also

- [coro-status-check](coro-status-check.md)
- [err-xpcall-traceback](err-xpcall-traceback.md)
- [err-propagate-context](err-propagate-context.md)
