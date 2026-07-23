# api-predicate-methods

> Use ? suffix for boolean-returning methods

## Why It Matters

The `?` suffix signals that a method returns `true` or `false`. It's a strong Ruby convention that makes code read like natural language: `user.admin?`, `array.empty?`. Always use `?` for methods whose primary purpose is returning a boolean.

## Bad

```ruby
class Order
  def paid; payment_status == "paid"; end
  def valid; errors.empty?; end
  def has_items; items.any?; end
end
# Reads poorly: 'if order.paid'
```

## Good

```ruby
class Order
  def paid?; payment_status == "paid"; end
  def valid?; errors.empty?; end
  def items?; items.any?; end
  def ready_to_ship?; paid? && !shipped?; end
end
# Reads naturally: 'if order.paid?'
```

## See Also

- [name-predicate-question](./name-predicate-question.md)
- [name-is-has-boolean](./name-is-has-boolean.md)
- [api-bang-methods](./api-bang-methods.md)
