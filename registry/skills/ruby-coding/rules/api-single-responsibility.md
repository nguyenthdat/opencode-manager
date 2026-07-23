# api-single-responsibility

> Methods do one thing well

## Why It Matters

A method should have a single, well-defined purpose. Methods that mix concerns (fetching data AND transforming it AND saving it) are hard to test, reuse, and reason about. A method name should describe exactly what it does — if the name needs 'and', it's doing too much.

## Bad

```ruby
def process_order(order_data)
  validate!(order_data)
  order = Order.new(order_data)
  order.tax = calculate_tax(order)
  order.save!
  OrderMailer.confirmation(order).deliver_now
  Analytics.track("order_completed", order_id: order.id)
  order
end
```

## Good

```ruby
def process_order(order_data)
  order = build_order(order_data)
  save_order(order)
  notify_customer(order)
  track_order(order)
  order
end
private
def build_order(data)
  Order.new(data).tap { |o| o.tax = TaxCalculator.calculate(o); o.total = o.subtotal + o.tax }
end
def save_order(order); order.save!; end
def notify_customer(order); OrderMailer.confirmation(order).deliver_later; end
def track_order(order); Analytics.track("order_completed", order_id: order.id); end
```

## See Also

- [obj-single-responsibility](./obj-single-responsibility.md)
- [rails-skinny-controller](./rails-skinny-controller.md)
- [rails-service-objects](./rails-service-objects.md)
