# lint-rubocop-standard

> Use RuboCop (or Standard Ruby) with consistent config

## Why It Matters

RuboCop is the standard Ruby linter/formatter. Standard Ruby (standard gem) provides a zero-config alternative with opinionated defaults. Choose one and enforce it in CI.

## Bad

# No linter configured -- every PR has different style
# PR reviews waste time on formatting nits
```


## Good

```yaml
# .rubocop.yml
require:
  - rubocop-performance
  - rubocop-rails
  - rubocop-rspec

AllCops:
  TargetRubyVersion: 3.3
  NewCops: enable

# CI:
rubocop --parallel
```


## See Also

- [proj-rubocop-configure](./proj-rubocop-configure.md)
- [lint-fasterer-speed](./lint-fasterer-speed.md)
