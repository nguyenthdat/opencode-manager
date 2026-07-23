# test-arrange-act-assert

> Structure tests as arrange/act/assert

## Why It Matters

Separating test setup (arrange), the action under test (act), and the verification (assert) into clear, visually distinct sections makes each test read as a small, self-contained story — much easier to scan quickly than tests that interleave setup and assertions throughout.

## Bad

```lua
it("applies a discount to eligible orders", function()
  local order = Order.new({ total = 100 })
  assert.is_true(order:is_eligible_for_discount())  -- assertion mixed into setup
  order.customer = { loyalty_tier = "gold" }
  local discounted = order:apply_discount()
  assert.are.equal(90, discounted.total)
  assert.are.equal("gold", order.customer.loyalty_tier)  -- unrelated re-assertion
end)
```

## Good

```lua
it("applies a discount to eligible orders", function()
  -- Arrange
  local order = Order.new({ total = 100, customer = { loyalty_tier = "gold" } })

  -- Act
  local discounted = order:apply_discount()

  -- Assert
  assert.are.equal(90, discounted.total)
end)

it("does not discount ineligible orders", function()
  -- Arrange
  local order = Order.new({ total = 100, customer = { loyalty_tier = "standard" } })

  -- Act
  local result = order:apply_discount()

  -- Assert
  assert.are.equal(100, result.total)
end)
```

## Keep Each Test Focused on One Behavior

Splitting the "eligible" and "ineligible" cases into two separate `it` blocks (rather than one large test with several unrelated assertions) keeps failures precise: a failing test name tells you exactly which behavior broke.

## See Also

- [test-busted-describe-it](test-busted-describe-it.md)
- [test-descriptive-names](test-descriptive-names.md)
- [test-isolate-state](test-isolate-state.md)
