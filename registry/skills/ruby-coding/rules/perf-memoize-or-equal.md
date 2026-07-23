# perf-memoize-or-equal

> Use @var ||= for memoization (careful with false/nil)

## Why It Matters

@var ||= caches expensive computations. Standard pattern works for truthy results only -- use defined?(@var) when memoizing nil or false return values.

## Bad

```ruby
def admin?
  @admin ||= users.any?(&:admin?)
  # If there are no admins, any? returns false -- recomputed every time!
end

def expensive_computation
  @result ||= download_and_parse
  # Bug: if download_and_parse returns nil, it's recomputed every time
end
```


## Good

```ruby
def admin?
  return @admin if defined?(@admin)
  @admin = users.any?(&:admin?)  # Works with false
end

def expensive_computation
  return @result if defined?(@result)
  @result = download_and_parse  # Works with nil
end

# For truthy-only results, ||= is fine:
def user
  @user ||= User.find(user_id)  # Always truthy or raises
end
```


## See Also

- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
- [obj-freeze-constants](./obj-freeze-constants.md)
