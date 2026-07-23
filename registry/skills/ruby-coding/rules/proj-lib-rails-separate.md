# proj-lib-rails-separate

> Separate lib/ from app/ concerns

## Why It Matters

Rails app/ is for framework-coupled code (models, controllers, views). lib/ is for framework-independent business logic. This separation makes logic testable without Rails and reusable across contexts.

## Bad

```ruby
# app/services/tax_calculator.rb
class TaxCalculator
  def calculate(order)
    order.subtotal * Order::TAX_RATE  # Depends on Order constant
  end
end
```


## Good

```ruby
# lib/tax_calculator.rb
class TaxCalculator
  TAX_RATE = 0.08

  def calculate(subtotal)
    subtotal * TAX_RATE
  end
end

# app/services/order_tax_service.rb
class OrderTaxService
  def initialize(order)
    @order = order
  end

  def calculate
    TaxCalculator.new.calculate(@order.subtotal)
  end
end
```


## See Also

- [rails-service-objects](./rails-service-objects.md)
- [proj-bundler-convention](./proj-bundler-convention.md)
