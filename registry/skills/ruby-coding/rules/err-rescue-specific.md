# err-rescue-specific

> Rescue specific exceptions, not Exception

## Why It Matters

Ruby's exception hierarchy has `Exception` at the top, which includes `SignalException` and `SystemExit` — rescuing `Exception` catches Ctrl-C and system exits, making your program unkillable. Always rescue the most specific exception class that captures the failure mode you intend to handle.

`rescue` without a class defaults to `StandardError`, which is the safe default for application-level errors.


## Bad

```ruby
begin
  process_data
rescue Exception => e
  # Catches SignalException, SystemExit, NoMemoryError -- dangerous!
  logger.error("Something failed: #{e.message}")
end
```


## Good

```ruby
begin
  process_data
rescue IOError => e
  logger.error("I/O failure: #{e.message}")
  retry if e.is_a?(Errno::EAGAIN)
rescue JSON::ParserError => e
  logger.error("Malformed input: #{e.message}")
rescue StandardError => e
  logger.error("Unexpected error: #{e.message}")
end
```


## See Also

- [err-no-exception-rescue](./err-no-exception-rescue.md)
- [anti-rescue-everything](./anti-rescue-everything.md)
