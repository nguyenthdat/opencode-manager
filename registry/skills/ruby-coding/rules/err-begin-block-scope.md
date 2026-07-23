# err-begin-block-scope

> Minimize begin/rescue block scope

## Why It Matters

Larger `begin`/`rescue` blocks make it unclear which line raised the exception. Keep the protected block as small as possible — ideally a single method call — so rescue handlers target a specific failure.

Use Ruby's method-level rescue syntax (`def foo; ...; rescue; end`) for wrapping an entire method body, but prefer the explicit `begin` block for narrow scoping.


## Bad

```ruby
def create_order(params)
  begin
    user = User.find(params[:user_id])
    order = Order.new(params[:order])
    order.apply_discount(params[:coupon])
    order.save!
    OrderMailer.confirmation(order).deliver_now
    Analytics.track("order_created", order_id: order.id)
    order
  rescue StandardError => e
    logger.error("Order creation failed: #{e}")
    nil
  end
end
```


## Good

```ruby
def create_order(params)
  user = User.find(params[:user_id])
  order = Order.new(params[:order])

  begin
    order.apply_discount(params[:coupon])
  rescue InvalidCouponError => e
    logger.warn("Invalid coupon #{params[:coupon]}: #{e.message}")
  end

  order.save!
  OrderMailer.confirmation(order).deliver_now
  order
end
```


## See Also

- [err-rescue-specific](./err-rescue-specific.md)
- [err-ensure-cleanup](./err-ensure-cleanup.md)
