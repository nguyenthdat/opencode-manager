# err-no-exception-rescue

> Rescue StandardError, not Exception

## Why It Matters

Rescuing `Exception` catches `NoMemoryError`, `SystemStackError`, `SignalException`, `SystemExit`, and other errors that should not be rescued at the application level. `StandardError` is the correct base class for application-level exceptions.

`rescue` without an explicit class defaults to `StandardError` — that's the safe default. If you must rescue broadly, rescue `StandardError` explicitly for clarity.


## Bad

```ruby
begin
  run_worker
rescue Exception => e
  # Catches SignalException -- can't stop with Ctrl-C
  # Catches SystemExit -- can't exit normally
  # Catches NoMemoryError -- can't recover anyway
  logger.error(e)
  retry
end
```


## Good

```ruby
begin
  run_worker
rescue StandardError => e
  logger.error("Worker error: #{e.class}: #{e.message}")
  # Don't retry NoMemoryError or SystemStackError -- they're fatal
  retry if retryable?(e)
end
```


## See Also

- [err-rescue-specific](./err-rescue-specific.md)
- [anti-rescue-everything](./anti-rescue-everything.md)
