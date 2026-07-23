# rails-skinny-controller

> Keep controllers thin; move logic to services/models

## Why It Matters

Controllers should handle HTTP concerns only: params, session, rendering, redirecting. Business logic in controllers can't be reused, is hard to test, and bloats with conditionals.

## Bad

```ruby
class OrdersController < ApplicationController
  def create
    order = Order.new(order_params)
    order.tax = order.subtotal * 0.08
    if order.coupon_code.present?
      discount = Coupon.find_by(code: order.coupon_code)&.discount || 0
      order.total = (order.subtotal + order.tax) * (1 - discount)
    end
    order.save!
    OrderMailer.confirmation(order).deliver_later
    redirect_to order
  end
end
```


## Good

```ruby
class OrdersController < ApplicationController
  def create
    order = OrderProcessor.new(order_params).process!
    redirect_to order
  end
end

class OrderProcessor
  def initialize(params)
    @params = params
  end

  def process!
    order = Order.create!(@params)
    apply_discount(order)
    OrderMailer.confirmation(order).deliver_later
    order
  end
end
```


## See Also

- [rails-service-objects](./rails-service-objects.md)
- [rails-fat-model](./rails-fat-model.md)
