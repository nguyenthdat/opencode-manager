# rails-service-objects

> Use service objects for complex business operations

## Why It Matters

Service objects encapsulate business processes that span multiple models. They're easier to test, reuse, and modify than controller/model code. Name them with verb-based names.

## Bad

```ruby
class OrdersController < ApplicationController
  def cancel
    @order = Order.find(params[:id])
    @order.transaction do
      @order.update!(status: "cancelled")
      @order.items.each { |i| i.product.increment!(:stock, i.quantity) }
      RefundProcessor.new(@order).process!
    end
    redirect_to @order
  end
end
```


## Good

```ruby
class CancelOrderService
  def initialize(order)
    @order = order
  end

  def call
    ActiveRecord::Base.transaction do
      @order.update!(status: "cancelled")
      restock_items
      issue_refund
    end
  end

  private

  def restock_items
    @order.items.each { |i| i.product.increment!(:stock, i.quantity) }
  end

  def issue_refund
    RefundProcessor.new(@order).process!
  end
end

class OrdersController < ApplicationController
  def cancel
    CancelOrderService.new(Order.find(params[:id])).call
    redirect_to orders_path
  end
end
```


## See Also

- [rails-skinny-controller](./rails-skinny-controller.md)
- [api-single-responsibility](./api-single-responsibility.md)
