# coro-status-check

> Check `coroutine.status` before resuming

## Why It Matters

`coroutine.resume` on a coroutine that has already finished (`"dead"`) or that is currently running (`"running"`/`"normal"`, in nested-coroutine scenarios) either errors or produces confusing results. Checking `coroutine.status` before resuming avoids these avoidable runtime errors and lets a scheduler safely skip coroutines that are already done.

## Bad

```lua
local co = coroutine.create(function()
  coroutine.yield(1)
  coroutine.yield(2)
end)

coroutine.resume(co)  -- yields 1
coroutine.resume(co)  -- yields 2
coroutine.resume(co)  -- co is now dead after this call returns
coroutine.resume(co)  -- errors: "cannot resume dead coroutine" -- unguarded
```

## Good

```lua
local co = coroutine.create(function()
  coroutine.yield(1)
  coroutine.yield(2)
end)

local function step(coro)
  if coroutine.status(coro) == "dead" then
    return nil, "coroutine already finished"
  end
  local ok, value = coroutine.resume(coro)
  if not ok then
    return nil, value
  end
  return value
end

print(step(co))  -- 1
print(step(co))  -- 2
print(step(co))  -- nil (co returned, no more yields, status now "dead")
print(step(co))  -- nil, "coroutine already finished" -- safely guarded

-- A scheduler managing many coroutines skips dead ones automatically
local function run_all(coroutines)
  local active = true
  while active do
    active = false
    for _, coro in ipairs(coroutines) do
      if coroutine.status(coro) ~= "dead" then
        active = true
        coroutine.resume(coro)
      end
    end
  end
end
```

## Status Values

`"suspended"` (not started, or yielded), `"running"` (currently executing), `"normal"` (resumed another coroutine and is waiting), `"dead"` (finished or errored).

## See Also

- [coro-wrap-vs-create](coro-wrap-vs-create.md)
- [coro-cooperative-scheduling](coro-cooperative-scheduling.md)
- [coro-no-leaked-coroutines](coro-no-leaked-coroutines.md)
