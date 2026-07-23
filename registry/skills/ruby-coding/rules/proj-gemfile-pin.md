# proj-gemfile-pin

> Pin gem versions; use pessimistic operator (~>)

## Why It Matters

Unpinned gems can introduce breaking changes or vulnerabilities. The pessimistic operator ~> locks the major version while allowing minor/patch updates. Pin dependencies in gemspec for gems.

## Bad

```ruby
# No version constraints -- unpredictable:
gem "rails"
gem "sidekiq"
gem "rspec-rails"
```


## Good

```ruby
gem "rails", "~> 7.2.0"      # >= 7.2.0, < 7.3.0
gem "sidekiq", "~> 7.3"      # >= 7.3.0, < 8.0.0
gem "rspec-rails", "~> 7.0"  # >= 7.0.0, < 8.0.0

# In .gemspec (for gems):
spec.add_dependency "activesupport", ">= 6.0", "< 8.0"
```


## See Also

- [sec-dependency-audit](./sec-dependency-audit.md)
