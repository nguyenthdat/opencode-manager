# err-cause-chaining

> Use raise ... cause: to chain exceptions

## Why It Matters

When wrapping a lower-level exception in a domain exception, preserve the original exception as the `cause`. Exception chaining creates a clear causal chain in logs and backtraces, making debugging easier.

Without explicit chaining, the original error is lost.


## Bad

```ruby
def load_config(path)
  YAML.safe_load(File.read(path))
rescue Errno::ENOENT => e
  raise ConfigError, "Config file not found: #{path}"
  # Original Errno::ENOENT is lost -- no way to see the file path
end
```


## Good

```ruby
def load_config(path)
  YAML.safe_load(File.read(path))
rescue Errno::ENOENT => e
  raise ConfigError, "Config file not found: #{path}", cause: e
rescue Psych::SyntaxError => e
  raise ConfigError, "Invalid YAML in #{path}: #{e.message}", cause: e
end

# Now the full chain is available:
begin
  load_config("config.yml")
rescue ConfigError => e
  puts e.message      # "Config file not found: config.yml"
  puts e.cause.message # "No such file or directory @ rb_sysopen"
  puts e.cause.class  # Errno::ENOENT
end
```


## See Also

- [err-custom-exception](./err-custom-exception.md)
- [err-log-and-raise](./err-log-and-raise.md)
