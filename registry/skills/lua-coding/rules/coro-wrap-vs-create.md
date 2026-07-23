# coro-wrap-vs-create

> Use `coroutine.wrap` for simple iterators; `coroutine.create` + `resume` for control

## Why It Matters

`coroutine.wrap(f)` returns a plain function that resumes the coroutine each call and *propagates errors as a Lua error* (via `error()`), which is convenient for simple generator-style use but means you can't inspect success/failure without wrapping the call in `pcall` yourself. `coroutine.create(f)` returns a coroutine object that you drive with `coroutine.resume`, which returns `(ok, ...)` explicitly — giving you full control over error handling and status inspection, at the cost of slightly more boilerplate.

## Bad

```lua
-- Using coroutine.wrap where you actually need to detect and handle errors
-- gracefully -- an error inside the coroutine just propagates as a crash
local gen = coroutine.wrap(function()
  for i = 1, 5 do
    if i == 3 then error("bad item at index 3") end
    coroutine.yield(i)
  end
end)

for v in gen do
  print(v)  -- crashes uncaught on the 3rd iteration
end
```

## Good

```lua
-- coroutine.create + resume: explicit control over success/failure per step
local co = coroutine.create(function()
  for i = 1, 5 do
    if i == 3 then error("bad item at index 3") end
    coroutine.yield(i)
  end
end)

while true do
  local ok, value_or_err = coroutine.resume(co)
  if not ok then
    print("generator failed: " .. value_or_err)
    break
  end
  if coroutine.status(co) == "dead" then break end
  print(value_or_err)
end

-- coroutine.wrap is the right, concise choice when the body is trusted
-- not to error, e.g. a simple, well-tested range generator:
local function range(n)
  return coroutine.wrap(function()
    for i = 1, n do coroutine.yield(i) end
  end)
end
for i in range(5) do print(i) end
```

## See Also

- [coro-generator-pattern](coro-generator-pattern.md)
- [coro-error-propagation](coro-error-propagation.md)
- [coro-status-check](coro-status-check.md)
