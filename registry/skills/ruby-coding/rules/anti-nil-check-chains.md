# anti-nil-check-chains

> Don't chain nil checks; use &. or Null Object

## Why It Matters

Nested nil checks (if x && x.y && x.y.z) are fragile and obscure the happy path. Use the safe navigation operator &. for optional chaining or the Null Object pattern for defaults.

## Bad

```ruby
def city
  if user && user.address && user.address.city
    user.address.city
  end
end

def company_name
  user.profile && user.profile.company && user.profile.company.name
end
```


## Good

```ruby
def city
  user&.address&.city
end

def company_name
  user&.profile&.company&.name
end

# Or with defaults:
def city
  user&.address&.city || "Unknown"
end
```


## See Also

- [api-null-object](./api-null-object.md)
