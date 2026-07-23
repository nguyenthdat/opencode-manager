# name-constants-upper-snake

> UPPER_SNAKE_CASE for constants

## Why It Matters

Constants should use SCREAMING_SNAKE_CASE. This convention immediately signals immutability and distinguishes constants from variables and methods.

## Bad

```ruby
MaxRetries = 3
default_timeout = 30
ApiUrl = "https://..."
```


## Good

```ruby
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30
API_URL = "https://...".freeze
```


## See Also

- [name-classes-pascal-case](./name-classes-pascal-case.md)
- [name-methods-snake-case](./name-methods-snake-case.md)
