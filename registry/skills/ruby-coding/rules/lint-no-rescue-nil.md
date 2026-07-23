# lint-no-rescue-nil

> Forbid rescue nil patterns

## Why It Matters

Rescue nil silently swallows errors. RuboCop's Style/RescueStandardError and Lint/SuppressedException cops can catch these patterns. Use rescue with a specific handler.

## Bad

```ruby
value = potentially_failing_method rescue nil
# Silently swallows all errors -- impossible to debug
```


## Good

```ruby
begin
  value = potentially_failing_method
rescue SpecificError => e
  logger.warn("Failed: #{e.message}")
  value = nil
end
```


## See Also

- [err-no-rescue-nil](./err-no-rescue-nil.md)
- [err-rescue-specific](./err-rescue-specific.md)
