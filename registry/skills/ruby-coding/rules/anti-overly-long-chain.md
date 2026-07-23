# anti-overly-long-chain

> Don't chain beyond 3-4 method calls

## Why It Matters

Long method chains are hard to debug (which method returned nil?) and violate the Law of Demeter. Break chains into intermediate variables or use delegation.

## Bad

```ruby
report = user.profile.company.department.manager.name.upcase
# If any link in the chain returns nil -- NoMethodError with obscure stack trace

total = order.items.first.product.category.tax_rate * order.items.first.price
```


## Good

```ruby
# Break into intermediate variables:
profile = user.profile
company = profile&.company
department = company&.department
manager = department&.manager
report = manager&.name&.upcase

# Use delegation to hide the chain:
class User
  delegate :manager_name, to: :profile, allow_nil: true
end

class Profile
  delegate :manager_name, to: :department, allow_nil: true
end
```


## See Also

- [anti-nil-check-chains](./anti-nil-check-chains.md)
- [api-single-responsibility](./api-single-responsibility.md)
