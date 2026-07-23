# block-group-by-partition

> Use .group_by and .partition for grouping

## Why It Matters

`.group_by` returns a Hash mapping each distinct block return value to an Array of matching elements. `.partition` splits elements into two arrays: those where the block is truthy and those where it's falsy. Both are more expressive and concise than manual grouping loops.

Use `.group_by` for multi-bucket grouping, `.partition` for binary splits.


## Bad

```ruby
by_status = {}
orders.each do |order|
  by_status[order.status] ||= []
  by_status[order.status] << order
end

active = []
inactive = []
users.each do |user|
  if user.active?
    active << user
  else
    inactive << user
  end
end
```


## Good

```ruby
by_status = orders.group_by(&:status)

active, inactive = users.partition(&:active?)

# group_by with transformation:
by_age_group = users.group_by { |u|
  case u.age
  when 0..17 then :minor
  when 18..64 then :adult
  else :senior
  end
}

# Chunking for consecutive elements:
sorted = [1, 1, 2, 3, 3, 4].chunk_while { |a, b| a == b }.to_a
# => [[1, 1], [2], [3, 3], [4]]
```


## See Also

- [block-with-object](./block-with-object.md)
- [block-select-reject](./block-select-reject.md)
