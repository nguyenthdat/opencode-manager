# lint-complexity

> Limit ABC and cyclomatic complexity

## Why It Matters

ABC (Assignment-Branch-Condition) and cyclomatic complexity measure code understandability. RuboCop can enforce maximums. Use guard clauses and decomposition to reduce complexity.

## Bad

```yaml
# .rubocop.yml:
Metrics/AbcSize:
  Enabled: false  # No complexity limit
Metrics/CyclomaticComplexity:
  Enabled: false
```


## Good

```yaml
# .rubocop.yml:
Metrics/AbcSize:
  Max: 20
Metrics/CyclomaticComplexity:
  Max: 10
```


## See Also

- [lint-method-length](./lint-method-length.md)
- [api-single-responsibility](./api-single-responsibility.md)
