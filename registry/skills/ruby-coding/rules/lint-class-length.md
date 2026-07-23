# lint-class-length

> Limit class length to 100-200 lines

## Why It Matters

Large classes likely violate SRP -- they do too many things. A 200-line limit (excluding comments) encourages splitting into smaller, focused classes.

## Bad

# .rubocop.yml:
Metrics/ClassLength:
  Enabled: false  # Classes grow to 500+ lines
```


## Good

```yaml
# .rubocop.yml:
Metrics/ClassLength:
  Max: 200
  Exclude:
    - "db/migrate/**/*"
    - "spec/**/*"
```


## See Also

- [lint-method-length](./lint-method-length.md)
- [obj-single-responsibility](./obj-single-responsibility.md)
