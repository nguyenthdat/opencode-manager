# rails-jobs-idempotent

> Make background jobs idempotent

## Why It Matters

Background jobs may execute multiple times (retries, network errors, worker restarts). Idempotent jobs produce the same result whether run once or many times. Use database locks, unique IDs, or status checks.

## Bad

```ruby
class ProcessPaymentJob < ApplicationJob
  def perform(order_id)
    order = Order.find(order_id)
    order.pay!  # Charges the customer -- runs twice = double charge!
  end
end
```


## Good

```ruby
class ProcessPaymentJob < ApplicationJob
  def perform(order_id)
    order = Order.find(order_id)

    # Guard: only process if not already paid
    return if order.paid?

    order.with_lock do  # Prevent concurrent execution
      order.pay! unless order.paid?
    end
  end
end

# Or use unique job plugin:
# sidekiq_options lock: :until_executed
```


## See Also

- [test-sidekiq-jobs](./test-sidekiq-jobs.md)
- [rails-service-objects](./rails-service-objects.md)
