# err-log-and-raise

> Log before re-raising when appropriate

## Why It Matters

When rescuing to add context (e.g., in a middleware or wrapper), log the error before re-raising so the original failure is recorded. Simply re-raising without logging loses information about where the error was caught.

Be careful not to double-log — if the caller will also log, consider whether logging at both levels adds value.


## Bad

```ruby
def import_from_csv(path)
  CSV.foreach(path) do |row|
    process_row(row)
  end
rescue CSV::MalformedCSVError => e
  raise ImportError, "CSV import failed for #{path}"
  # Original error is lost in logs if no one logs ImportError
end
```


## Good

```ruby
def import_from_csv(path)
  CSV.foreach(path) do |row|
    process_row(row)
  end
rescue CSV::MalformedCSVError => e
  Rails.logger.error(
    "[Import] CSV parse error in #{File.basename(path)} " \
    "at line #{e.line}: #{e.message}"
  )
  raise ImportError, "CSV import failed for #{path}", cause: e
end
```


## See Also

- [err-cause-chaining](./err-cause-chaining.md)
- [err-exception-message](./err-exception-message.md)
