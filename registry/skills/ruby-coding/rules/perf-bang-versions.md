# perf-bang-versions

> Use mutating methods (!) when object reuse is safe

## Why It Matters

Mutating methods (with ! suffix) modify the receiver in place, avoiding allocations. Use them when the original object is no longer needed. Only use when safe -- don't mutate shared state.

## Bad

```ruby
# Creates new objects each time:
result = result.map(&:strip)
result = result.select(&:present?)
array = array + new_items
```


## Good

```ruby
# Mutates in place -- no new allocations:
result.map!(&:strip)
result.select!(&:present?)
array.concat(new_items)  # Mutates array in place
```


## See Also

- [perf-string-concat](./perf-string-concat.md)
- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
