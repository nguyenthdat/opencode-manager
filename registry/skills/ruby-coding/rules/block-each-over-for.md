# block-each-over-for

> Use .each over for loops

## Why It Matters

`for` loops in Ruby are just syntax sugar for calling `.each` but introduce a new variable scope that leaks the iteration variable. `.each` with a block is the idiomatic Ruby way, creates a proper closure scope, and composes with the Enumerable chain.

Performance difference is negligible — prefer clarity and consistency.


## Bad

```ruby
for item in items
  puts item
end
# item still accessible here -- leaked variable!

for i in 0...array.length
  process(array[i])
end
```


## Good

```ruby
items.each do |item|
  puts item
end
# item is out of scope -- clean

# Or with index
items.each_with_index do |item, index|
  puts "#{index}: #{item}"
end

# Range iteration
(0...array.length).each do |i|
  process(array[i])
end
```


## See Also

- [block-map-over-each](./block-map-over-each.md)
- [block-select-reject](./block-select-reject.md)
