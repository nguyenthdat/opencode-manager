# test-isolate-state

> Isolate module state between tests; reset `package.loaded` when needed

## Why It Matters

`require` caches modules in `package.loaded`, so if a module carries any internal state (a singleton counter, an in-memory cache table), every test in the same process shares that *same* state unless something resets it — leading to tests that pass or fail depending on run order, a classic source of test flakiness.

## Bad

```lua
describe("rate limiter", function()
  it("allows the first 3 calls", function()
    local limiter = require("rate_limiter")  -- cached singleton state
    for i = 1, 3 do assert.is_true(limiter.allow()) end
  end)

  it("blocks the 4th call", function()
    local limiter = require("rate_limiter")  -- SAME cached instance/state
    -- depending on whether the previous test ran first, this assertion
    -- may pass or fail unpredictably
    assert.is_false(limiter.allow())
  end)
end)
```

## Good

```lua
describe("rate limiter", function()
  before_each(function()
    package.loaded["rate_limiter"] = nil  -- force a fresh require() each test
  end)

  it("allows the first 3 calls", function()
    local limiter = require("rate_limiter")
    for i = 1, 3 do assert.is_true(limiter.allow()) end
  end)

  it("blocks the 4th call", function()
    local limiter = require("rate_limiter")  -- fresh state, independent of the other test
    for i = 1, 3 do limiter.allow() end
    assert.is_false(limiter.allow())
  end)
end)
```

## Better: Design Modules to Avoid Hidden Singleton State

Where possible, prefer a factory function (`rate_limiter.new()`) returning an independent instance per call over module-level singleton state — this sidesteps the whole `package.loaded` reset dance (see `api-singleton-vs-factory`).

## See Also

- [api-singleton-vs-factory](api-singleton-vs-factory.md)
- [test-mock-restore](test-mock-restore.md)
- [scope-module-pattern](scope-module-pattern.md)
