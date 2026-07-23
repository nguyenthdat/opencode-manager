# test-one-expectation

> One expectation per example when practical

## Why It Matters

Tests with a single expectation are easier to debug -- a failure points to exactly one thing. When setup is expensive, multiple related expectations in one example are acceptable.

## Bad

```ruby
it "handles an order" do
  order = process_order
  expect(order.total).to eq(100)
  expect(order.status).to eq("confirmed")
  expect(order.items.count).to eq(2)
  expect(order.customer.name).to eq("Alice")
end
```


## Good

```ruby
it "calculates the correct total" do
  order = process_order
  expect(order.total).to eq(100)
end

it "sets status to confirmed" do
  order = process_order
  expect(order.status).to eq("confirmed")
end

# Acceptable -- setup is expensive:
it "creates a valid order", :aggregate_failures do
  order = process_order
  expect(order.total).to eq(100)
  expect(order.status).to eq("confirmed")
end
```


## See Also

- [test-describe-context](./test-describe-context.md)
- [test-matcher-compose](./test-matcher-compose.md)
