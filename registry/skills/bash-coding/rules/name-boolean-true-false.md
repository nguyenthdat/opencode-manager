# name-boolean-true-false

> Use 0/1 for boolean return values

## Why It Matters

Shell functions return an exit status (0-255), where 0 means success/true and non-zero means failure/false — the inverse of most programming languages. Consistently using 0 for "true/success" and 1 for "false/failure" aligns with exit code conventions and allows functions to be used directly in `if`, `&&`, and `||` constructs.

## Bad

```bash
# Returning 1 for "true" — breaks conditional logic
is_valid() {
    [[ "$1" =~ ^[0-9]+$ ]] && return 1   # 1 = valid? Confusing!
    return 0
}

if is_valid "123"; then  # Runs on INVALID input!
    echo "Valid"
fi

# Using string "true"/"false" strings
is_admin() {
    grep -q "$USER" /etc/admin && echo "true" || echo "false"
}

if [ "$(is_admin)" = "true" ]; then  # Verbose, slow, fragile
    echo "Admin"
fi
```

## Good

```bash
# Return 0 for true/success, non-zero for false/failure
is_valid() {
    [[ "$1" =~ ^[0-9]+$ ]]
}

if is_valid "123"; then
    echo "Valid number"
fi

# Boolean variables: use 0/1
declare dry_run=0     # 0 = false/off
declare verbose=0

while (($# > 0)); do
    case "$1" in
        --dry-run) dry_run=1; shift ;;
        --verbose) verbose=1; shift ;;
    esac
done

if ((dry_run)); then
    echo "Dry run mode"
fi

if ((verbose)); then
    echo "Verbose output enabled"
fi
```

## Boolean Convention Table

| Context | True/Success | False/Failure |
|---------|-------------|---------------|
| Exit code | 0 | 1-255 |
| Variable value | 1 | 0 |
| `(( ))` arithmetic | `((var))` is true when var != 0 | `((var))` is false when var == 0 |
| `[[ ]]` test | `[[ -n "$var" ]]` | `[[ -z "$var" ]]` |

## See Also

- [err-meaningful-exit](./err-meaningful-exit.md) - Meaningful exit codes
- [fn-return-values](./fn-return-values.md) - Returning values from functions
