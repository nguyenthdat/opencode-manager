# test-coroutine-testing

> Test coroutine-based code by driving `resume`/`yield` explicitly

## Why It Matters

A generator or scheduler built on coroutines can't be tested by just calling it and checking a return value — its behavior unfolds step-by-step across multiple `resume` calls. Tests need to drive the coroutine through each yield point explicitly and assert on the value produced at each step, plus its final state.

## Bad

```lua
it("generates values", function()
  local gen = my_generator()
  -- Only checking the first value tells you almost nothing about
  -- whether the generator continues correctly across multiple resumes
  assert.are.equal(1, gen())
end)
```

## Good

```lua
local function make_gen()
  return coroutine.wrap(function()
    coroutine.yield(1)
    coroutine.yield(2)
    coroutine.yield(3)
  end)
end

it("yields values in order, then stops", function()
  local gen = make_gen()
  assert.are.equal(1, gen())
  assert.are.equal(2, gen())
  assert.are.equal(3, gen())
  assert.is_nil(gen())   -- coroutine finished; wrap returns nil after completion
end)

-- Testing a coroutine.create-based generator: drive resume() directly and
-- assert on both the yielded value and the coroutine's status
it("reports status transitions correctly", function()
  local co = coroutine.create(function()
    coroutine.yield("a")
    coroutine.yield("b")
  end)

  local ok1, v1 = coroutine.resume(co)
  assert.is_true(ok1)
  assert.are.equal("a", v1)
  assert.are.equal("suspended", coroutine.status(co))

  coroutine.resume(co)
  coroutine.resume(co)
  assert.are.equal("dead", coroutine.status(co))
end)
```

## See Also

- [coro-generator-pattern](coro-generator-pattern.md)
- [coro-status-check](coro-status-check.md)
- [test-arrange-act-assert](test-arrange-act-assert.md)
