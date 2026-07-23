# name-module-namespace

> Use module namespacing to avoid conflicts

## Why It Matters

Top-level class names pollute the global namespace and risk conflicts with other libraries. Wrap related classes in a module namespace reflecting your project or domain.

## Bad

```ruby
class Client; end
class Config; end
# Another library:
class Client; end  # Reopens -- conflict!
```


## Good

```ruby
module MyApp
  class Client; end
  class Config; end
end
module PaymentGateway
  class Client; end  # No conflict with MyApp::Client
end
```


## See Also

- [name-classes-pascal-case](./name-classes-pascal-case.md)
- [proj-bundler-convention](./proj-bundler-convention.md)
