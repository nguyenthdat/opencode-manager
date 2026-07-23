# block-with-object

> Use each_with_object for accumulator patterns

## Why It Matters

`.each_with_object(obj)` iterates with a mutable accumulator object, returning the accumulator at the end. Unlike `.reduce`/`.inject`, you don't need to return the accumulator from every block iteration — it's always the same object.

Use `.each_with_object` for building Hashes or Arrays. Use `.reduce` when the accumulator is immutable (numbers, frozen arrays).


## Bad

```ruby
# reduce with mutation -- works but violates reduce semantics
by_category = items.reduce({}) do |hash, item|
  hash[item.category] ||= []
  hash[item.category] << item
  hash  # Must return hash each time
end

# each with manual accumulator
grouped = {}
items.each do |item|
  grouped[item.category] ||= []
  grouped[item.category] << item
end
grouped
```


## Good

```ruby
by_category = items.each_with_object({}) do |item, hash|
  (hash[item.category] ||= []) << item
end

# With default value:
by_category = items.each_with_object(Hash.new { |h, k| h[k] = [] }) do |item, hash|
  hash[item.category] << item
end

# For simple grouping, use group_by:
by_category = items.group_by(&:category)
```


## See Also

- [block-reduce-inject](./block-reduce-inject.md)
- [block-group-by-partition](./block-group-by-partition.md)
- [block-tap-yield](./block-tap-yield.md)
