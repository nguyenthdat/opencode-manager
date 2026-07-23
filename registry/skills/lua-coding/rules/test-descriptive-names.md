# test-descriptive-names

> Give tests descriptive names that state the expected behavior

## Why It Matters

A test name like `test1` or `test_calculate` tells you nothing when it shows up red in a CI log — you have to open the file to find out what actually broke. A name phrased as a behavior statement ("returns zero for orders over the free-shipping threshold") makes a failing test report readable on its own, without opening an editor.

## Bad

```lua
describe("shipping", function()
  it("test1", function() ... end)
  it("works", function() ... end)
  it("calculate", function() ... end)
end)
```

## Good

```lua
describe("calculate_shipping", function()
  it("charges the base rate for orders under the free-shipping threshold", function()
    ...
  end)

  it("is free for orders at or above $100", function()
    ...
  end)

  it("adds a surcharge for orders over 20kg", function()
    ...
  end)

  it("errors when weight_kg is negative", function()
    ...
  end)
end)
```

## Nesting `describe` Blocks Reads Like a Spec

```lua
describe("Order", function()
  describe("when the customer has a gold loyalty tier", function()
    it("applies a 10% discount", function() ... end)
  end)

  describe("when the customer has no loyalty tier", function()
    it("applies no discount", function() ... end)
  end)
end)
```

Read top to bottom, `describe`/`it` nesting composes into a readable sentence: "Order, when the customer has a gold loyalty tier, applies a 10% discount."

## See Also

- [test-busted-describe-it](test-busted-describe-it.md)
- [test-arrange-act-assert](test-arrange-act-assert.md)
- [test-assert-messages](test-assert-messages.md)
