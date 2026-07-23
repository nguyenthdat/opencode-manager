# block-any-all-none

> Use .any?/.all?/.none? over manual bool tracking

## Why It Matters

`.any?` returns `true` if at least one element matches. `.all?` returns `true` if all elements match. `.none?` returns `true` if no elements match. These methods are more expressive than manual boolean flags and short-circuit when possible.

`.one?` returns `true` if exactly one element matches — useful for uniqueness checks.


## Bad

```ruby
has_admin = false
users.each do |user|
  has_admin = true if user.admin?
end

all_valid = true
items.each do |item|
  unless item.valid?
    all_valid = false
    break
  end
end
```


## Good

```ruby
has_admin = users.any?(&:admin?)
all_valid = items.all?(&:valid?)
no_errors = items.none? { |item| item.errors.any? }

# Exactly one match
single_admin = users.one?(&:admin?)

# Without block: truthiness check
items.any?     # true if collection non-empty with any truthy element
items.all?     # true if all elements are truthy
```


## See Also

- [block-find-over-select-first](./block-find-over-select-first.md)
- [block-select-reject](./block-select-reject.md)
