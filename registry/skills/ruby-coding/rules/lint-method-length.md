# lint-method-length

> Limit method length to 10-15 lines

## Why It Matters

Long methods are hard to understand, test, and refactor. A 15-line limit forces decomposition into smaller, single-purpose methods. Exclude migrations and DSL-style code.

## Bad

# .rubocop.yml:
Metrics/MethodLength:
  Enabled: false  # Methods grow unbounded
```


## Good

```yaml
# .rubocop.yml:
Metrics/MethodLength:
  Max: 15
  Exclude:
    - "db/migrate/**/*"
    - "spec/**/*"
```


## See Also

- [lint-class-length](./lint-class-length.md)
- [lint-complexity](./lint-complexity.md)
