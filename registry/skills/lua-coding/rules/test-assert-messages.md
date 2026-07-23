# test-assert-messages

> Provide descriptive assertion messages, especially for non-obvious checks

## Why It Matters

A failing assertion with no message forces whoever reads the failure to go read the test source just to understand what was expected — an assertion message that states the intent directly turns a red CI run into an immediately actionable failure, especially for less-obvious business-rule checks.

## Bad

```lua
it("calculates shipping cost", function()
  local cost = calculate_shipping(order)
  assert(cost == 12.50)   -- if this fails: "assertion failed!" -- no context at all
end)
```

## Good

```lua
it("calculates shipping cost", function()
  local cost = calculate_shipping(order)
  assert(cost == 12.50, ("expected shipping cost 12.50 for a %dkg order, got %.2f")
    :format(order.weight_kg, cost))
end)

-- busted's assertion library already includes good default messages for
-- common comparisons, so prefer it over bare assert() where available:
it("calculates shipping cost", function()
  local cost = calculate_shipping(order)
  assert.are.equal(12.50, cost)
  -- failure message automatically includes: "Expected objects to be equal.
  -- Passed in: 12.5  Expected: 12.5" plus a diff -- no manual message needed
end)

-- For less-obvious domain assertions, add context busted can't infer:
it("skips shipping charge for orders over the free-shipping threshold", function()
  local cost = calculate_shipping({ total = 150, weight_kg = 2 })
  assert.are.equal(0, cost, "orders over $100 should ship free")
end)
```

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md)
- [test-descriptive-names](test-descriptive-names.md)
- [err-validate-args](err-validate-args.md)
