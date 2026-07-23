# block-ampersand-shorthand

> Use &:method shorthand for simple blocks

## Why It Matters

`&:method_name` (Symbol#to_proc) converts a symbol to a block that calls that method on each element. It's shorter, clearer, and slightly faster than an explicit block for single-method calls.

Only use when the block is a single method call with no arguments. For anything more complex, use an explicit block.


## Bad

```ruby
names = users.map { |user| user.name }
ids = items.map { |item| item.id }
active = users.select { |user| user.active? }
prices = products.sum { |product| product.price }
```


## Good

```ruby
names = users.map(&:name)
ids = items.map(&:id)
active = users.select(&:active?)
prices = products.sum(&:price)

# Chaining works:
users.map(&:address).compact.map(&:city).uniq

# But DON'T use for multi-arg or complex blocks:
# Bad: items.map(&:fetch(:key))  -- SyntaxError!
# Use explicit block instead:
items.map { |item| item.fetch(:key) }
```


## See Also

- [block-numbered-params](./block-numbered-params.md)
- [block-map-over-each](./block-map-over-each.md)
