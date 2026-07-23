# proj-rubocop-gradual

> Use rubocop_todo.yml for gradual adoption

## Why It Matters

rubocop_todo.yml lists all current violations, suppressing them. It allows adopting RuboCop incrementally: fix violations file by file while blocking new violations in changed code.

## Bad

# Adding RuboCop to an existing project -- 5000 offenses, team gives up
# Configuration is abandoned after one CI run
```


## Good

```bash
# Generate todo file:
$ rubocop --auto-gen-config

# .rubocop.yml:
inherit_from: .rubocop_todo.yml

# Fix offenses category by category:
# 1. Fix Style/FrozenStringLiteralComment
# 2. Remove from .rubocop_todo.yml
# 3. Repeat until .rubocop_todo.yml is empty
```


## See Also

- [lint-rubocop-standard](./lint-rubocop-standard.md)
- [lint-frozen-string-literal](./lint-frozen-string-literal.md)
