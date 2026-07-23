# test-mock-tables

> Mock dependencies via plain table/function substitution

## Why It Matters

Because Lua functions and modules are ordinary values, you don't need a special mocking framework to substitute a fake implementation — assign a stub function/table in place of the real dependency for the duration of the test. This works cleanly as long as the code under test takes its dependencies as parameters or reads them via `require`, rather than hardcoding globals.

## Bad

```lua
-- notifier.lua hardcodes a real HTTP call with no way to substitute it in tests
local http = require("http_client")

local function notify_user(user_id, message)
  return http.post("/notify", { user_id = user_id, message = message })
end
```

## Good

```lua
-- notifier.lua -- dependency is injectable, defaults to the real module
local http = require("http_client")

local function notify_user(user_id, message, http_client)
  http_client = http_client or http
  return http_client.post("/notify", { user_id = user_id, message = message })
end

return { notify_user = notify_user }
```

```lua
-- notifier_spec.lua
describe("notify_user", function()
  it("posts to the /notify endpoint", function()
    local calls = {}
    local fake_http = {
      post = function(path, body)
        table.insert(calls, { path = path, body = body })
        return { status = 200 }
      end,
    }

    local notifier = require("notifier")
    notifier.notify_user(42, "hello", fake_http)

    assert.are.equal(1, #calls)
    assert.are.equal("/notify", calls[1].path)
    assert.are.equal(42, calls[1].body.user_id)
  end)
end)
```

## See Also

- [test-mock-restore](test-mock-restore.md)
- [test-busted-spy](test-busted-spy.md)
- [fn-first-class-functions](fn-first-class-functions.md)
