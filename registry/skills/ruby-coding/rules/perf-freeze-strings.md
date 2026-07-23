# perf-freeze-strings

> Use # frozen_string_literal: true

## Why It Matters

frozen_string_literal: true makes all string literals frozen, reducing allocations and GC pressure. It's the default in Ruby 4.0+. Add it to the top of every .rb file to avoid unnecessary string copying.

## Bad

```ruby
# Every `"hello"` creates a new String object:
10_000.times do
  "hello".upcase  # 20,000 allocations (string + upcase)
end
```


## Good

```ruby
# frozen_string_literal: true

# `"hello"` is a frozen literal -- no allocation per iteration:
10_000.times do
  "hello".upcase   # Only creates the upcase'd copy (frozen source reused)
end

# To modify, explicitly create a mutable copy:
str = +"hello"     # Unary + creates unfrozen copy
str << " world"
```


## See Also

- [obj-freeze-constants](./obj-freeze-constants.md)
- [lint-frozen-string-literal](./lint-frozen-string-literal.md)
