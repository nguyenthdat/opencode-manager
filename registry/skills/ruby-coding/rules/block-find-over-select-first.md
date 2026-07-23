# block-find-over-select-first

> Use .find (alias detect) over .select.first

## Why It Matters

`.find` (alias `.detect`) returns the first element matching the block and stops iteration. `.select.first` processes the entire collection, then takes the first result — wasteful for large collections.

`.find` returns `nil` if no match is found. Use `.find { ... } || default` or pass a proc as the second argument for a default.


## Bad

```ruby
# Processes ALL users, then takes the first
admin = users.select { |u| u.admin? }.first

# Even worse -- map then find
email = users.map { |u| u.email if u.active? }.compact.first
```


## Good

```ruby
admin = users.find(&:admin?)  # Stops at first match

# With default
email = users.find(-> { "no-email@example.com" }) { |u| u.active? }
email = users.find { |u| u.active? }&.email || "no-email@example.com"
```


## See Also

- [block-select-reject](./block-select-reject.md)
- [block-any-all-none](./block-any-all-none.md)
