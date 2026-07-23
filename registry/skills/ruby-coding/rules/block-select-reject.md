# block-select-reject

> Use .select/.reject over manual if in each

## Why It Matters

`.select` (alias `.find_all`) returns elements for which the block is truthy. `.reject` returns elements for which the block is falsy. Using `.each` with manual conditional appending is verbose and hides the filtering intent.

For filtering and transforming in one pass, use `.filter_map` (Ruby 2.7+).


## Bad

```ruby
active_users = []
users.each do |user|
  active_users << user if user.active?
end

cheap_items = []
items.each do |item|
  cheap_items << item unless item.price > 100
end
```


## Good

```ruby
active_users = users.select(&:active?)
cheap_items = items.reject { |item| item.price > 100 }

# Partition into two groups at once
active, inactive = users.partition(&:active?)

# Filter + transform (Ruby 2.7+)
admin_emails = users.filter_map { |u| u.email if u.admin? }
```


## See Also

- [block-map-over-each](./block-map-over-each.md)
- [block-group-by-partition](./block-group-by-partition.md)
