# perf-map-over-each

> Use .map over .each with push

## Why It Matters

.map allocates one array of the correct size. .each with push causes multiple array resizes and allocations. The performance difference compounds with collection size.

## Bad

```ruby
names = []
users.each { |u| names << u.full_name }
# Multiple allocations as array grows
```


## Good

```ruby
names = users.map(&:full_name)  # Single allocation, correct size
# For transformation with condition:
names = users.filter_map { |u| u.full_name if u.active? }
```


## See Also

- [block-map-over-each](./block-map-over-each.md)
- [perf-bang-versions](./perf-bang-versions.md)
