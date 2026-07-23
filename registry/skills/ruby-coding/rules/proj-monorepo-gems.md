# proj-monorepo-gems

> Use path-based gem references in Gemfile for monorepos

## Why It Matters

In monorepos, reference local gems with path: instead of published versions. This makes local development seamless -- changes to gems are picked up without re-installing.

## Bad

```ruby
# Gemfile -- points to published version, not local:
gem "my_engine", "~> 1.0"
# Must publish gem to test in app -- slow feedback loop
```


## Good

```ruby
# Gemfile -- local development:
gem "my_engine", path: "engines/my_engine"
gem "shared_models", path: "gems/shared_models"

# Optional: use git for CI environments:
# gem "my_engine", git: "https://github.com/org/my_engine"
```


## See Also

- [proj-gemfile-pin](./proj-gemfile-pin.md)
- [proj-bundler-convention](./proj-bundler-convention.md)
