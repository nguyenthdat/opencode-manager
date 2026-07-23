# test-luaunit-classes

> Use `luaunit` for xUnit-style test classes where that convention fits better

## Why It Matters

`luaunit` mirrors JUnit/xUnit-style testing (test functions grouped as methods on a table, `TestX:testY()` naming, run via `LuaUnit.run()`) — a familiar shape for developers coming from other languages, and a good fit for projects (embedded/game scripting environments in particular) that don't want busted's heavier dependency footprint or DSL style.

## Bad

```lua
-- Mixing ad hoc assert() calls with no framework at all -- no reporting,
-- no isolation between tests, first failure aborts the whole run
assert(add(2, 3) == 5)
assert(add(-2, -3) == -5)
print("done")
```

## Good

```lua
-- test_calculator.lua
local luaunit = require("luaunit")
local calculator = require("calculator")

TestCalculator = {}

function TestCalculator:setUp()
  self.calc = calculator.new()
end

function TestCalculator:testAddPositive()
  luaunit.assertEquals(self.calc:add(2, 3), 5)
end

function TestCalculator:testAddNegative()
  luaunit.assertEquals(self.calc:add(-2, -3), -5)
end

function TestCalculator:testDivideByZeroErrors()
  luaunit.assertErrorMsgContains("division by zero", self.calc.divide, self.calc, 1, 0)
end

os.exit(luaunit.LuaUnit.run())
```

```sh
lua test_calculator.lua
```

## busted vs. luaunit

Both are legitimate; `busted` is more common in the general Lua/OpenResty ecosystem and has richer mocking/spy support out of the box, while `luaunit` is a single dependency-free file that's easy to vendor into constrained embedding environments (e.g. game engines without LuaRocks access).

## See Also

- [test-busted-describe-it](test-busted-describe-it.md)
- [test-arrange-act-assert](test-arrange-act-assert.md)
- [proj-rockspec-luarocks](proj-rockspec-luarocks.md)
