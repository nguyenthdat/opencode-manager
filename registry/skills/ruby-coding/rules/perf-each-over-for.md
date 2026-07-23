# perf-each-over-for

> Use .each over for loops (for is slower in MRI)

## Why It Matters

In CRuby (MRI/YJIT), `for` loops create an extra scope and leak the iteration variable outside the loop. `.each` with a block is not only the idiomatic Ruby choice but also performs better because it avoids the overhead of Ruby's `for` implementation, which is essentially a wrapper around `.each` with additional scope management overhead.

In hot loops (10K+ iterations), the accumulated overhead of `for` vs `.each` becomes measurable. Additionally, `.each` chains seamlessly with other Enumerable methods, while `for` requires manual array building.

## Bad

```ruby
for item in items
  process(item)
end
# item is still accessible here -- leaked variable

for i in 0...array.length
  process(array[i])
end
```

## Good

```ruby
items.each { |item| process(item) }
# item is out of scope

items.each_with_index { |item, idx| process(item, idx) }

# Range iteration -- idiomatic
(0...array.length).each { |i| process(array[i]) }
array.each_index { |i| process(array[i]) }
```

## See Also

- [block-each-over-for](./block-each-over-for.md)
- [perf-map-over-each](./perf-map-over-each.md)
- [perf-avoid-object-alloc](./perf-avoid-object-alloc.md)
