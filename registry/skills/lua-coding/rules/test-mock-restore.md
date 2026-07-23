# test-mock-restore

> Always restore mocked globals/functions after a test

## Why It Matters

When a test has to stub a genuinely global dependency (`os.time`, `io.open`, a require-cached module field) rather than an injectable parameter, that mutation leaks into every test that runs afterward unless it's explicitly undone — causing flaky, order-dependent test failures that are painful to track down.

## Bad

```lua
it("uses a fixed timestamp", function()
  os.time = function() return 1700000000 end  -- global mutation, never restored
  assert.are.equal(1700000000, get_timestamp())
end)

it("uses the real clock", function()
  -- os.time is STILL the stub from the previous test if it ran first --
  -- this test now silently gets a fixed, wrong timestamp
  local t = get_timestamp()
  assert.is_true(t > 1600000000)
end)
```

## Good

```lua
describe("timestamp handling", function()
  local original_time

  before_each(function()
    original_time = os.time
  end)

  after_each(function()
    os.time = original_time   -- always restored, regardless of pass/fail
  end)

  it("uses a fixed timestamp", function()
    os.time = function() return 1700000000 end
    assert.are.equal(1700000000, get_timestamp())
  end)

  it("uses the real clock", function()
    local t = get_timestamp()
    assert.is_true(t > 1600000000)   -- unaffected by the previous test's stub
  end)
end)
```

## Prefer Injectable Dependencies to Avoid This Entirely

Where possible, prefer `test-mock-tables`'s injectable-dependency approach over stubbing true globals — it sidesteps the restore-discipline problem completely, since nothing global is ever mutated in the first place.

## See Also

- [test-mock-tables](test-mock-tables.md)
- [test-isolate-state](test-isolate-state.md)
- [test-busted-spy](test-busted-spy.md)
