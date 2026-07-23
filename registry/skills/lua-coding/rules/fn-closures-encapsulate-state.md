# fn-closures-encapsulate-state

> Use closures to encapsulate state instead of relying on globals

## Why It Matters

A closure over a `local` variable gives you private, mutable state without a class, a metatable, or any risk of another module reaching in and mutating it directly — the upvalue is only reachable through the functions that close over it. This is a lightweight alternative to full "object" machinery when you just need a bit of hidden state (a counter, a cache, a rate limiter).

## Bad

```lua
-- Global counter -- visible and mutable from anywhere, name can collide
request_count = 0

function track_request()
  request_count = request_count + 1
  return request_count
end
```

## Good

```lua
-- request_count only exists as an upvalue inside this closure; nothing
-- outside this module can read or corrupt it directly
local function make_counter()
  local count = 0
  return function()
    count = count + 1
    return count
  end
end

local track_request = make_counter()
print(track_request())  -- 1
print(track_request())  -- 2

-- Multiple independent counters, no shared/global state at all
local a_counter = make_counter()
local b_counter = make_counter()
print(a_counter(), b_counter())  -- 1  1 -- fully independent
```

## A Rate Limiter via Closure

```lua
local function make_rate_limiter(max_per_window, window_seconds)
  local calls, window_start = 0, os.time()
  return function()
    local now = os.time()
    if now - window_start >= window_seconds then
      calls, window_start = 0, now
    end
    if calls >= max_per_window then
      return false
    end
    calls = calls + 1
    return true
  end
end
```

## See Also

- [scope-local-by-default](scope-local-by-default.md)
- [scope-closure-capture](scope-closure-capture.md)
- [fn-no-closures-hot-loop](fn-no-closures-hot-loop.md)
