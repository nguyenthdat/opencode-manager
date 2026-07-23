# err-raise-over-fail

> Use raise, not fail (community convention)

## Why It Matters

`raise` and `fail` are aliases in Ruby, but the community convention is: use `raise` to raise exceptions, and reserve `fail` (if at all) for when an expectation has been violated. Most style guides and linters recommend `raise` exclusively for consistency.

RuboCop's `Style/SignalException` cop enforces this by default.


## Bad

```ruby
def process!(data)
  fail ArgumentError, "data is nil" if data.nil?

  begin
    transform(data)
  rescue => e
    fail ProcessingError, e.message
  end
end
```


## Good

```ruby
def process!(data)
  raise ArgumentError, "data is nil" if data.nil?

  begin
    transform(data)
  rescue => e
    raise ProcessingError, e.message
  end
end
```


## See Also

- [err-custom-exception](./err-custom-exception.md)
- [err-exception-message](./err-exception-message.md)
