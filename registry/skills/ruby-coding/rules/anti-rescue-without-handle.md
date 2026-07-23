# anti-rescue-without-handle

> Don't rescue without logging or handling

## Why It Matters

Empty rescue blocks hide errors silently. Always log the error or provide a recovery action. If intentionally ignoring, add a comment explaining why.

## Bad

```ruby
def process_file(path)
  data = File.read(path)
rescue
  # Silently returns nil -- no log, no context
end

item.save! rescue nil  # Never do this
```


## Good

```ruby
def process_file(path)
  data = File.read(path)
rescue Errno::ENOENT => e
  Rails.logger.warn("File not found: #{path} -- #{e.message}")
  nil  # Intentional: optional file
rescue StandardError => e
  Rails.logger.error("Failed to read #{path}: #{e.message}")
  raise  # Re-raise unexpected errors
end
```


## See Also

- [err-no-rescue-nil](./err-no-rescue-nil.md)
- [err-log-and-raise](./err-log-and-raise.md)
