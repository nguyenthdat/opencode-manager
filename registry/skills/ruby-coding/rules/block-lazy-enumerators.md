# block-lazy-enumerators

> Use .lazy for large enumerable chains

## Why It Matters

Chaining `.map.select.first` creates intermediate arrays at each step. `.lazy` defers evaluation until a terminal method (`.first`, `.to_a`, `.take`) is called, processing only what's needed.

Use `.lazy` when working with large or infinite collections and chaining multiple operations where intermediate arrays would be expensive.


## Bad

```ruby
# Processes ALL lines, creates intermediate arrays
first_three = File.readlines("large_file.log")
  .map { |line| line.strip }
  .select { |line| line.start_with?("ERROR") }
  .first(3)

# Infinite range without lazy -- never terminates
(1..Float::INFINITY).map { |n| n * 2 }.select { |n| n % 3 == 0 }.first(5)
```


## Good

```ruby
# Lazy -- stops as soon as 3 matching lines are found
first_three = File.foreach("large_file.log").lazy
  .map(&:strip)
  .select { |line| line.start_with?("ERROR") }
  .first(3)

# Infinite range with lazy -- works fine
result = (1..).lazy
  .map { |n| n * 2 }
  .select { |n| n % 3 == 0 }
  .first(5)
# => [6, 12, 18, 24, 30]

# Always call a terminal method -- lazy enumerators are lazy!
lazy_enum = (1..).lazy.map { _1 * 2 }  # No evaluation yet
```


## See Also

- [block-map-over-each](./block-map-over-each.md)
- [block-select-reject](./block-select-reject.md)
- [perf-read-buffer](./perf-read-buffer.md)
