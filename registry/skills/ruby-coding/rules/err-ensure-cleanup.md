# err-ensure-cleanup

> Use ensure for resource cleanup

## Why It Matters

`ensure` blocks run whether an exception is raised or not, making them the correct mechanism for releasing resources (file handles, database connections, network sockets). Unlike `rescue`-then-cleanup, `ensure` guarantees cleanup even when an unexpected exception propagates.

Combine with block forms of resource methods (`File.open { }`) when available, as they handle cleanup automatically.


## Bad

```ruby
def process_file(path)
  file = File.open(path, "r")
  data = file.read
  process(data)
  file.close  # Skipped if process(data) raises
rescue IOError => e
  file.close rescue nil  # Duplicated, error-prone
  raise
end

def with_lock
  @mutex.lock
  yield
  @mutex.unlock  # Skipped if yield raises -- deadlock!
end
```


## Good

```ruby
# Block form -- cleanup handled automatically:
def process_file(path)
  File.open(path, "r") do |file|
    data = file.read
    process(data)
  end
end

# Ensure for non-block resources:
def with_lock
  @mutex.lock
  begin
    yield
  ensure
    @mutex.unlock  # Always runs -- no deadlock
  end
end
```


## See Also

- [err-begin-block-scope](./err-begin-block-scope.md)
- [err-rescue-specific](./err-rescue-specific.md)
