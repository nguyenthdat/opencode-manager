# err-meaningful-exit

> Exit with meaningful non-zero codes

## Why It Matters

Exit codes are the primary mechanism for communicating results to calling programs and CI/CD pipelines. Using `exit 0` for failures or `exit 1` for everything makes it impossible to distinguish different error modes. Meaningful exit codes enable callers to take appropriate action — retry on transient errors, escalate on permanent ones, or route errors to the right handler.

## Bad

```bash
# Everything exits 1 — no differentiation
validate_input() {
    if [ -z "$1" ]; then
        echo "Missing argument" >&2
        exit 1
    fi
    if [ ! -f "$1" ]; then
        echo "File not found" >&2
        exit 1   # Same code, different error
    fi
}

# Using exit 0 for errors
if ! process_data; then
    exit 0  # Hides the failure from callers
fi
```

## Good

```bash
# Meaningful exit codes
declare -r EXIT_SUCCESS=0
declare -r EXIT_INVALID_ARGS=2
declare -r EXIT_FILE_NOT_FOUND=3
declare -r EXIT_PERMISSION_DENIED=4
declare -r EXIT_NETWORK_ERROR=5

validate_input() {
    if [ "$#" -lt 1 ]; then
        echo "Usage: $0 <file>" >&2
        exit "$EXIT_INVALID_ARGS"
    fi
    if [ ! -f "$1" ]; then
        echo "File not found: $1" >&2
        exit "$EXIT_FILE_NOT_FOUND"
    fi
}

# Caller can handle specific error types
validate_input "$@"
case $? in
    0) ;;
    2) show_usage; exit 2 ;;
    3) echo "Check the file path" >&2; exit 3 ;;
    *) exit $? ;;
esac
```

## Standard Exit Code Ranges

| Range | Purpose |
|-------|---------|
| 0 | Success |
| 1 | General/catch-all error |
| 2-63 | Script-specific errors |
| 64-78 | sysexits.h conventions (`EX_USAGE`, `EX_DATAERR`, etc.) |
| 126 | Command cannot execute |
| 127 | Command not found |
| 128+N | Killed by signal N |

## See Also

- [err-check-exit-status](./err-check-exit-status.md) - Checking exit codes
- [err-return-over-exit-fn](./err-return-over-exit-fn.md) - Return vs exit
