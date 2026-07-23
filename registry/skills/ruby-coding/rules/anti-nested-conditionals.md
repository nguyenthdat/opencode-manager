# anti-nested-conditionals

> Don't nest conditionals beyond 2 levels

## Why It Matters

Deeply nested conditionals are hard to read and test. Use guard clauses, early returns, or extract methods to flatten the logic.

## Bad

```ruby
def process(order)
  if order.paid?
    if order.shippable?
      if order.in_stock?
        order.ship!
      else
        order.backorder!
      end
    else
      order.cancel!
    end
  else
    send_payment_reminder(order)
  end
end
```


## Good

```ruby
def process(order)
  return send_payment_reminder(order) unless order.paid?
  return order.cancel! unless order.shippable?
  return order.backorder! unless order.in_stock?

  order.ship!
end
```


## See Also

- [lint-complexity](./lint-complexity.md)
- [api-single-responsibility](./api-single-responsibility.md)
