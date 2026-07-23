# anti-rescue-everything

> Don't rescue Exception; rescue StandardError

## Why It Matters

Rescuing Exception catches fatal errors (SignalException, SystemExit, NoMemoryError) that should never be caught. Always rescue StandardError or more specific exceptions.

## Bad

```ruby
begin
  process_data
rescue Exception => e
  # Catches Ctrl-C, kill signals, out-of-memory errors
  logger.error(e)
end
```


## Good

```ruby
begin
  process_data
rescue StandardError => e
  # Catches application-level errors only
  logger.error(e)
end
```


## See Also

- [err-no-exception-rescue](./err-no-exception-rescue.md)
- [err-rescue-specific](./err-rescue-specific.md)
