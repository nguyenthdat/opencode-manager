# fn-callback-signature

> Keep callback signatures consistent (err-first or ok/err, pick one)

## Why It Matters

Async-style Lua code (network I/O in OpenResty, game engine event callbacks, coroutine-based schedulers) passes callback functions around constantly. If some callbacks receive `(err, result)`, others `(result, err)`, and others `(ok, result_or_err)`, every callback author has to check documentation instead of relying on a predictable, muscle-memory convention.

## Bad

```lua
-- Inconsistent shapes across the same codebase
http.get(url, function(err, body) ... end)          -- err first
db.query(sql, function(rows, err) ... end)           -- err second
file.read(path, function(ok, data_or_err) ... end)   -- ok flag, ambiguous 2nd arg
```

## Good

```lua
-- Pick one convention project-wide and document it. A common, clear choice:
-- callback(err, result) -- err is nil on success, always checked first
local function get(url, callback)
  fetch_async(url, function(response, error_msg)
    if error_msg then
      callback(error_msg, nil)
    else
      callback(nil, response)
    end
  end)
end

get("https://example.com", function(err, body)
  if err then
    log.error(err)
    return
  end
  process(body)
end)

-- Whichever convention you choose, keep it uniform across the whole
-- module/project so every callback can be handled the same way:
local function query(sql, callback)
  run_async(sql, function(rows, error_msg)
    callback(error_msg, rows)   -- same (err, result) order as `get` above
  end)
end
```

## See Also

- [err-nil-err-pattern](err-nil-err-pattern.md)
- [api-consistent-arg-order](api-consistent-arg-order.md)
- [coro-async-callback-bridge](coro-async-callback-bridge.md)
