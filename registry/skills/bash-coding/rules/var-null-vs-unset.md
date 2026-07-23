# var-null-vs-unset

> Use `${var+isset}` vs `${var-unset}` for existence checks

## Why It Matters

Shell distinguishes between a variable that is unset (never assigned) and one that is empty (assigned `""`). Standard operators like `${var:-default}` conflate both cases. When your logic depends on whether a variable was explicitly set — for example, distinguishing "not provided" from "explicitly set to empty" — use the existence operators.

## Bad

```bash
# confuses unset with empty
if [ -z "$config_file" ]; then
    echo "Config not set"
fi
# $config_file="" and unset both trigger this

# Manual verbose check
if ! set | grep -q "^config_file="; then
    # unset
fi
```

## Good

```bash
# Check if set (even if empty)
if [ -n "${config_file+set}" ]; then
    echo "config_file is explicitly set (may be empty)"
fi

# Check if unset
if [ -z "${config_file+set}" ]; then
    echo "config_file is not set at all"
fi

# Default only when unset (not empty)
: "${config_file:="${HOME}/.config/app.conf"}"

# Different defaults for unset vs empty
db_host="${DB_HOST-${DEFAULT_HOST}}"   # Only if unset
db_name="${DB_NAME:-${DEFAULT_NAME}}"  # If unset OR empty
```

## Operator Reference

| Operator | Unset | Empty (set to "") | Non-empty |
|----------|-------|-------------------|-----------|
| `${var-default}` | `default` | `""` | `$var` |
| `${var:-default}` | `default` | `default` | `$var` |
| `${var+alt}` | nothing | `alt` | `alt` |
| `${var:+alt}` | nothing | nothing | `alt` |

## See Also

- [var-default-values](./var-default-values.md) - Default value operators
- [var-indirect-reference](./var-indirect-reference.md) - Indirect variable access
