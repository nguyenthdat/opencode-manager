# block-map-over-each

> Use .map when building a new array

## Why It Matters

`.map` (alias `.collect`) transforms each element and collects results into a new array. Using `.each` with manual `<<` to build an array is more verbose, error-prone (forgetting the accumulator), and doesn't convey the transformation intent.

Use `.map` for transformations, `.each` for side effects only.


## Bad

```ruby
names = []
users.each do |user|
  names << user.full_name
end

squared = []
numbers.each { |n| squared.push(n * n) }
```


## Good

```ruby
names = users.map(&:full_name)
squared = numbers.map { |n| n * n }

# With index
indexed = users.map.with_index { |user, i| "#{i + 1}. #{user.full_name}" }

# With filter + map in one pass (Ruby 2.7+)
admin_names = users.filter_map { |u| u.full_name if u.admin? }
```


## See Also

- [block-select-reject](./block-select-reject.md)
- [block-flat-map](./block-flat-map.md)
- [perf-map-over-each](./perf-map-over-each.md)
