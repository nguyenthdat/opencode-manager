# name-files-snake-case

> snake_case for file names

## Why It Matters

Ruby file names should match the snake_case of the class or module they contain. Rails autoloading relies on this convention to map file paths to constant names.

## Bad

```ruby
# File: lib/HttpClient.rb
class HttpClient; end
# File: app/models/userProfile.rb
class UserProfile; end
```


## Good

```ruby
# File: lib/http_client.rb
class HttpClient; end
# File: app/models/user_profile.rb
class UserProfile; end
```


## See Also

- [name-classes-pascal-case](./name-classes-pascal-case.md)
- [name-methods-snake-case](./name-methods-snake-case.md)
