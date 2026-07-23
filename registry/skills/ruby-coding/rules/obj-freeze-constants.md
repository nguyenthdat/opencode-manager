# obj-freeze-constants

> Freeze constants to prevent mutation

## Why It Matters

Ruby constants are mutable by default — reassigning a constant produces a warning, but mutating its contents does not. Frozen constants prevent accidental mutation of shared state, which can cause hard-to-debug issues across a codebase.

Freeze all constant collections (Arrays, Hashes, Strings) to make them truly constant.


## Bad

```ruby
class HttpStatus
  SUCCESS_CODES = [200, 201, 204]
  SERVER_ERROR_CODES = [500, 502, 503]
  DEFAULT_HEADERS = { "Content-Type" => "application/json" }
end

# Elsewhere in codebase...
HttpStatus::SUCCESS_CODES << 208  # Mutates the constant!

STATUS_NAMES = {
  200 => "OK",
  404 => "Not Found"
}
STATUS_NAMES[500] = "Internal Server Error"  # Mutating
```


## Good

```ruby
class HttpStatus
  SUCCESS_CODES = [200, 201, 204].freeze
  SERVER_ERROR_CODES = [500, 502, 503].freeze
  DEFAULT_HEADERS = { "Content-Type" => "application/json" }.freeze

  STATUS_NAMES = {
    200 => "OK",
    404 => "Not Found"
  }.freeze
end

# For deeply nested structures, deep-freeze or use Data.define/immutable objects
```


## See Also

- [obj-immutable-value](./obj-immutable-value.md)
- [perf-freeze-strings](./perf-freeze-strings.md)
