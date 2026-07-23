# err-return-over-exit-fn

> Use `return` in functions, `exit` only at top level

## Why It Matters

`exit` in a function terminates the entire script, not just the function. This makes functions non-reusable — you can't call them from a prompt or another script that expects to continue after the function returns. `return` exits only the function, allowing the caller to decide how to handle the error. Reserve `exit` for the top-level script or for unrecoverable fatal errors.

## Bad

```bash
#!/usr/bin/env bash
set -e

process_file() {
    if [ ! -f "$1" ]; then
        echo "File not found" >&2
        exit 1     # Kills entire script, no recovery possible
    fi
    echo "Processing $1"
}

# Can't use this function interactively
# Can't loop and skip failed files
for f in *.txt; do
    process_file "$f"  # Exits script on first missing file!
done
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

process_file() {
    if [ ! -f "$1" ]; then
        echo "File not found: $1" >&2
        return 1     # Only returns from function
    fi
    echo "Processing $1"
}

# Caller decides how to handle failure
for f in *.txt; do
    if ! process_file "$f"; then
        echo "Skipping $f, continuing..." >&2
        continue
    fi
done

# Or: accumulate errors
errors=0
for f in *.txt; do
    process_file "$f" || ((errors++))
done
if ((errors > 0)); then
    echo "Failed to process ${errors} file(s)" >&2
    exit 1   # exit only at top level
fi
```

## Function Return vs Exit

```bash
my_func() {
    return 0  # Exit function with status 0 — caller continues
    return 1  # Exit function with status 1 — caller handles
    exit 1    # Terminates entire script — only for fatal errors
}

# exit is acceptable in these cases:
# 1. The main() function when it's the script entry point
# 2. A fatal error handler (e.g., after receiving SIGTERM)
# 3. A usage() function that exits after showing help
```

## See Also

- [fn-return-values](./fn-return-values.md) - Returning values from functions
- [fn-main-function](./fn-main-function.md) - Main function pattern
