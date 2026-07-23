# test-busted-describe-it

> Structure tests with busted's `describe`/`it` blocks

## Why It Matters

`busted` is the most widely used Lua test framework (used across LuaRocks packages, OpenResty modules, and many Neovim plugins). Its `describe`/`it` structure groups related tests, supports nested contexts, and integrates `before_each`/`after_each` hooks — following it lets your test suite work with the wider tooling ecosystem (CI runners, coverage tools) that expects this shape.

## Bad

```lua
-- Ad hoc test script with no structure, hard to run selectively or report on
local function test_add()
  assert(add(2, 3) == 5)
end

local function test_add_negative()
  assert(add(-2, -3) == -5)
end

test_add()
test_add_negative()
print("all tests passed")
```

## Good

```lua
-- calculator_spec.lua
local calculator = require("calculator")

describe("calculator", function()
  describe("add", function()
    it("adds two positive numbers", function()
      assert.are.equal(5, calculator.add(2, 3))
    end)

    it("adds two negative numbers", function()
      assert.are.equal(-5, calculator.add(-2, -3))
    end)
  end)

  describe("divide", function()
    it("errors on division by zero", function()
      assert.has_error(function() calculator.divide(1, 0) end)
    end)
  end)
end)
```

```sh
busted calculator_spec.lua
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md)
- [test-busted-spy](test-busted-spy.md)
- [test-isolate-state](test-isolate-state.md)
