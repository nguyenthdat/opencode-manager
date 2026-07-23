# name-classes-pascal-case

> PascalCase for classes and modules

## Why It Matters

Ruby convention uses PascalCase for class and module names. This visually distinguishes types from methods and variables.

## Bad

```ruby
class http_client; end
class json_parser; end
module api_helpers; end
```


## Good

```ruby
class HttpClient; end
class JsonParser; end  # Acronyms treated as words
module ApiHelpers; end
```


## See Also

- [name-methods-snake-case](./name-methods-snake-case.md)
- [name-constants-upper-snake](./name-constants-upper-snake.md)
