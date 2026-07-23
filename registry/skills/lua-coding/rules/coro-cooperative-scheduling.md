# coro-cooperative-scheduling

> Build a cooperative scheduler/event loop over coroutines for concurrency

## Why It Matters

Lua coroutines are cooperative, single-threaded, and yield/resume-driven — the same primitive used to build async I/O frameworks (OpenResty's ngx.* API, Neovim's async plugin patterns, LuaJIT-based game engine task systems). Understanding the "scheduler resumes coroutines, coroutines yield when waiting" shape lets you write sequential-looking code that is actually non-blocking.

## Bad

```lua
-- Callback soup: nesting grows with every additional async step ("pyramid of doom")
fetch_user(id, function(user)
  fetch_orders(user.id, function(orders)
    fetch_shipping(orders[1].id, function(shipping)
      display(user, orders, shipping)
    end)
  end)
end)
```

## Good

```lua
-- A minimal scheduler: a queue of ready coroutines, resumed until they yield
local Scheduler = {}
Scheduler.__index = Scheduler

function Scheduler.new()
  return setmetatable({ ready = {} }, Scheduler)
end

function Scheduler:spawn(fn)
  local co = coroutine.create(fn)
  table.insert(self.ready, co)
end

function Scheduler:run()
  while #self.ready > 0 do
    local co = table.remove(self.ready, 1)
    local ok, err = coroutine.resume(co)
    if not ok then
      log.error("task failed: " .. tostring(err))
    elseif coroutine.status(co) ~= "dead" then
      table.insert(self.ready, co)  -- re-queue if it yielded but isn't done
    end
  end
end

-- Async helpers that bridge callbacks to yield/resume (see coro-async-callback-bridge)
local function await(async_fn, ...)
  local co = coroutine.running()
  async_fn(function(result) coroutine.resume(co, result) end, ...)
  return coroutine.yield()
end

local scheduler = Scheduler.new()
scheduler:spawn(function()
  local user = await(fetch_user_async, id)
  local orders = await(fetch_orders_async, user.id)
  local shipping = await(fetch_shipping_async, orders[1].id)
  display(user, orders, shipping)   -- reads like sequential, blocking code
end)
scheduler:run()
```

## See Also

- [coro-async-callback-bridge](coro-async-callback-bridge.md)
- [coro-status-check](coro-status-check.md)
- [embed-openresty-non-blocking](embed-openresty-non-blocking.md)
