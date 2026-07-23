# perf-string-concat

> Use << over += for string building

## Why It Matters

String#<< mutates the receiver. String#+= creates a new string object (allocates, copies both strings, garbage collects old). In loops, += causes O(n^2) allocations.

## Bad

```ruby
report = ""
items.each do |item|
  report += "#{item}: #{item.price}\n"  # New allocation each iteration!
end
```


## Good

```ruby
report = +""  # Unfrozen string
items.each do |item|
  report << "#{item}: #{item.price}\n"  # Mutates in place
end
# Even better for large strings:
report = items.map { |item| "#{item}: #{item.price}" }.join("\n")
```


## See Also

- [perf-bang-versions](./perf-bang-versions.md)
- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
