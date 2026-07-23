# meta-delegate-forward

> Use Forwardable or delegate over manual delegation

## Why It Matters

Manual delegation (writing `def foo; @obj.foo; end` for every method) is repetitive, error-prone, and obscures the delegation pattern. `Forwardable` from the standard library and Rails' `delegate` macro provide concise, intention-revealing delegation.

Use `Forwardable#def_delegators` for multiple methods, and Rails' `delegate ... to:` for ActiveRecord models.


## Bad

```ruby
class UserPresenter
  def initialize(user)
    @user = user
  end

  def name; @user.name; end
  def email; @user.email; end
  def avatar_url; @user.avatar_url; end
  def created_at; @user.created_at; end
  def bio; @user.bio; end
  # 20 more lines of boilerplate...
end
```


## Good

```ruby
require "forwardable"

class UserPresenter
  extend Forwardable

  def_delegators :@user, :name, :email, :avatar_url, :created_at, :bio

  def initialize(user)
    @user = user
  end

  # Custom behavior
  def display_name
    name.presence || "Anonymous"
  end
end

# Rails alternative:
class Order < ApplicationRecord
  belongs_to :customer
  delegate :name, :email, to: :customer, prefix: true, allow_nil: true
  # Creates: customer_name, customer_email
end
```


## See Also

- [api-public-api-minimal](./api-public-api-minimal.md)
- [obj-prefer-composition](./obj-prefer-composition.md)
