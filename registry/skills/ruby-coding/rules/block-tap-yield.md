# block-tap-yield

> Use .tap for debugging and chaining

## Why It Matters

`.tap` yields the receiver to a block and returns the receiver. Use it for debugging (inspecting intermediate values in a chain) and for side effects within a fluent interface.

Don't use `.tap` for core business logic — it obscures intent. Reserve it for logging, instrumentation, and temporary debugging.


## Bad

```ruby
user = User.new(params)
puts user.attributes  # Debug -- breaks the fluent chain
user.save
user

items = items.map do |item|
  if item.price > 100
    item.apply_discount(0.1)
  end
  item  # Must return item explicitly
end
```


## Good

```ruby
user = User.new(params).tap { |u| Rails.logger.debug(u.attributes) }
user.save

# Chain-preserving debug
result = items
  .select(&:published?)
  .tap { |filtered| Rails.logger.info("Selected #{filtered.count} items") }
  .map(&:process)

# Side effect within chain
items.map(&:price).tap { |prices| Stats.track!("prices", prices) }.sum
```


## See Also

- [block-with-object](./block-with-object.md)
- [api-fluent-interface](./api-fluent-interface.md)
