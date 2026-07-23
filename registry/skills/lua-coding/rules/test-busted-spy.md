# test-busted-spy

> Use busted's `spy`/`stub` for call verification

## Why It Matters

Beyond substituting a fake implementation (a mock), tests often need to verify *how* a function was called — how many times, with what arguments — without necessarily replacing its behavior. Busted's `spy` wraps a real function while recording calls; `stub` replaces it entirely while still recording — both avoid hand-rolling call-tracking tables for every test.

## Bad

```lua
it("logs an error when the request fails", function()
  local calls = 0
  local original_log_error = log.error
  log.error = function(...) calls = calls + 1 end  -- hand-rolled tracking

  handle_failed_request()

  log.error = original_log_error  -- manual restore, easy to forget on failure
  assert.are.equal(1, calls)
end)
```

## Good

```lua
it("logs an error when the request fails", function()
  local s = spy.on(log, "error")

  handle_failed_request()

  assert.spy(s).was_called(1)
  assert.spy(s).was_called_with("request failed: connection reset")

  s:revert()  -- explicit revert, or use before_each/after_each for automatic cleanup
end)

-- stub() replaces the function entirely (useful when you don't want the
-- real implementation to run at all, e.g. avoiding a real network call)
it("retries on failure", function()
  local call_count = 0
  local s = stub(http, "get", function()
    call_count = call_count + 1
    if call_count < 3 then error("network error") end
    return { status = 200 }
  end)

  local result = fetch_with_retry("https://example.com")

  assert.spy(s).was_called(3)
  assert.are.equal(200, result.status)

  s:revert()
end)
```

## See Also

- [test-mock-tables](test-mock-tables.md)
- [test-mock-restore](test-mock-restore.md)
- [test-busted-describe-it](test-busted-describe-it.md)
