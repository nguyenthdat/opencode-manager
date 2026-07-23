# embed-openresty-non-blocking

> Use `ngx.*` non-blocking APIs; never block an nginx worker with blocking I/O

## Why It Matters

Each OpenResty/nginx worker process handles many concurrent requests cooperatively on a single OS thread via nginx's event loop — any blocking call (vanilla Lua's `io.open`/socket calls, `os.execute`, a busy-loop) stalls *every other request* being handled by that worker for the duration of the block. OpenResty provides non-blocking equivalents (`ngx.socket.tcp`, cosockets, `ngx.sleep`) specifically so Lua code can do I/O without blocking the whole worker.

## Bad

```lua
-- Using plain Lua io/os calls blocks the ENTIRE nginx worker process --
-- every other concurrent request stalls until this finishes
content_by_lua_block {
  local handle = io.popen("curl https://slow-upstream.example.com")  -- BLOCKS
  local result = handle:read("*a")
  handle:close()
  ngx.say(result)
}

-- os.execute / io.* file operations, and Lua's own socket library (if
-- available at all) are similarly blocking and must be avoided here
```

## Good

```lua
-- ngx.socket.tcp() cosockets integrate with nginx's event loop -- Lua code
-- appears to block sequentially, but the worker keeps serving other
-- requests while this "waits" (it's actually yielding a coroutine internally)
content_by_lua_block {
  local sock = ngx.socket.tcp()
  sock:settimeout(5000)

  local ok, err = sock:connect("upstream.example.com", 80)
  if not ok then
    ngx.status = 502
    ngx.say("upstream connection failed: " .. err)
    return
  end

  sock:send("GET / HTTP/1.0\r\nHost: upstream.example.com\r\n\r\n")
  local response = sock:receive("*a")
  sock:close()

  ngx.say(response)
}

-- Never block with a busy sleep either -- use ngx.sleep, which also yields
-- to the event loop instead of blocking the worker
-- ngx.sleep(1)  -- non-blocking 1-second delay, safe in OpenResty
```

## See Also

- [embed-openresty-phases](embed-openresty-phases.md)
- [coro-cooperative-scheduling](coro-cooperative-scheduling.md)
- [coro-async-callback-bridge](coro-async-callback-bridge.md)
