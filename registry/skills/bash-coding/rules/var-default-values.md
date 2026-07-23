# var-default-values

> Use `${var:-default}` and `${var:=default}` for default values

## Why It Matters

Shell parameter expansion provides built-in mechanisms for default values, eliminating the need for verbose `if`-`else` checks. `${var:-default}` expands to `default` when `var` is unset or empty without modifying `var`. `${var:=default}` also assigns the default. These patterns are more concise and less error-prone than manual fallback logic.

## Bad

```bash
# Verbose manual default
if [ -z "$name" ]; then
    name="unknown"
fi
echo "Hello, $name"

# Even more verbose with separate variable
if [ -n "$user_input" ]; then
    value="$user_input"
else
    value="default"
fi
```

## Good

```bash
# Use :- for default without assignment
echo "Hello, ${name:-unknown}"

# Use := to assign and expand
: "${CONFIG_FILE:=/etc/app.conf}"

# Default from another variable
log_level="${LOG_LEVEL:-${DEFAULT_LOG_LEVEL}}"

# Default with command substitution
cache_dir="${XDG_CACHE_HOME:-$HOME/.cache}"

# Error if unset — exit with message
: "${REQUIRED_VAR:?REQUIRED_VAR must be set}"

# Only expand if set (alternative value with +)
backup="${BACKUP:+--backup $BACKUP}"

# Default for positional parameters
name="${1:-default_name}"
```

## Common Pattern Table

| Syntax | If var is unset/empty | If var is set | Side effect |
|--------|----------------------|---------------|-------------|
| `${var:-word}` | `word` | `$var` | None |
| `${var:=word}` | `word` (and assigns) | `$var` | Assigns |
| `${var:?word}` | Write `word` to stderr, exit | `$var` | Exits |
| `${var:+word}` | Nothing | `word` | None |

## See Also

- [var-null-vs-unset](./var-null-vs-unset.md) - Distinguishing null from unset
- [var-brace-variables](./var-brace-variables.md) - Brace syntax
