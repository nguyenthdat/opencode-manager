# anti-memoize-conditional

> Don't use ||= for memoizing false/nil returns

## Why It Matters

||= reassigns if the left side is falsy. For methods that legitimately return nil or false, this causes recomputation every call. Use defined?(@var) or a sentinel object.

## Bad

```ruby
def has_errors?
  @has_errors ||= validate
  # If validate returns false (no errors), recomputed EVERY time!
end

def config
  @config ||= load_config
  # If config is legitimately nil, reloaded every call
end
```


## Good

```ruby
def has_errors?
  return @has_errors if defined?(@has_errors)
  @has_errors = validate  # Works with false return
end

def config
  return @config if defined?(@config)
  @config = load_config  # Works with nil return
end
```


## See Also

- [perf-memoize-or-equal](./perf-memoize-or-equal.md)
