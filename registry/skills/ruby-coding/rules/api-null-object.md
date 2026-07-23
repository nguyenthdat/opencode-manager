# api-null-object

> Use Null Object pattern over nil checks

## Why It Matters

`nil` checks (`if user`, `user.try(:name)`, `user&.name`) proliferate through code and obscure the happy path. A Null Object implements the same interface as a real object but does nothing — eliminating `nil` checks entirely.

## Bad

```ruby
class OrderProcessor
  def process(order)
    if order.coupon; discount = order.coupon.percentage
    else discount = 0; end
    if order.customer; name = order.customer.full_name
    else name = "Guest"; end
    order.customer&.loyalty_points || 0
  end
end
```

## Good

```ruby
class NullCoupon
  def percentage; 0; end
  def code; "NONE"; end
  def valid?; false; end
end
class NullCustomer
  def full_name; "Guest"; end
  def loyalty_points; 0; end
end
class OrderProcessor
  def process(order)
    coupon = order.coupon || NullCoupon.new
    customer = order.customer || NullCustomer.new
    discount = coupon.percentage
    display_name = customer.full_name  # No nil checks
  end
end
```

## See Also

- [api-duck-type-over-class](./api-duck-type-over-class.md)
- [anti-nil-check-chains](./anti-nil-check-chains.md)
