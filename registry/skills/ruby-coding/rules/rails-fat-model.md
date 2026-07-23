# rails-fat-model

> Move query logic into model scopes and class methods

## Why It Matters

Scopes and class methods make queries reusable, composable, and testable. Inline where chains in controllers couple query logic to a specific action.

## Bad

```ruby
class OrdersController < ApplicationController
  def index
    @orders = Order.where(status: "paid")
                   .where("created_at > ?", 30.days.ago)
                   .order(created_at: :desc)
                   .limit(50)
  end
end
```


## Good

```ruby
class Order < ApplicationRecord
  scope :paid, -> { where(status: "paid") }
  scope :recent, -> { where("created_at > ?", 30.days.ago) }
  scope :newest_first, -> { order(created_at: :desc) }

  def self.recently_paid(limit: 50)
    paid.recent.newest_first.limit(limit)
  end
end

class OrdersController < ApplicationController
  def index
    @orders = Order.recently_paid
  end
end
```


## See Also

- [rails-scopes-chainable](./rails-scopes-chainable.md)
- [rails-skinny-controller](./rails-skinny-controller.md)
