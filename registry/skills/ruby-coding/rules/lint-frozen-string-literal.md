# lint-frozen-string-literal

> Enforce frozen_string_literal comments

## Why It Matters

Style/FrozenStringLiteralComment ensures every file starts with the frozen string literal pragma. This reduces allocations and is forward-compatible with Ruby 4.0 where it's the default.

## Bad

```ruby
# Missing pragma -- strings are mutable by default
class User
  DEFAULT_ROLE = "member"  # Allocates a new string each reference
end
```


## Good

```ruby
# frozen_string_literal: true

class User
  DEFAULT_ROLE = "member"  # Frozen, no re-allocation
end
```


## See Also

- [perf-freeze-strings](./perf-freeze-strings.md)
- [lint-rubocop-standard](./lint-rubocop-standard.md)
