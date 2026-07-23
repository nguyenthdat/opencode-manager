# err-trap-exit-cleanup

> Use `trap '...' EXIT` for cleanup

## Why It Matters

Shell scripts create temporary files, directories, and processes that must be cleaned up regardless of how the script exits. `trap '...' EXIT` ensures cleanup code runs whether the script succeeds, fails, or is interrupted by a signal. This prevents temporary file leaks, stale locks, and dangling resources.

## Bad

```bash
#!/usr/bin/env bash
set -e

TEMP_DIR="$(mktemp -d)"
process_data "$TEMP_DIR"
# If this fails, cleanup never runs
rm -rf "$TEMP_DIR"
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

TEMP_DIR="$(mktemp -d)"
TEMP_FILE="$(mktemp)"

cleanup() {
    local exit_code=$?
    rm -rf "$TEMP_DIR" "$TEMP_FILE"
    if (( exit_code != 0 )); then
        echo "Script failed with exit code ${exit_code}" >&2
    fi
    exit "$exit_code"
}

trap cleanup EXIT

process_data "$TEMP_DIR"
# cleanup always runs — even on error
```

## Cleanup Patterns

```bash
# Multiple resources — all cleaned
LOCK_DIR=""
TEMP_DIR=""
PID_FILE=""

cleanup() {
    rm -rf "${TEMP_DIR:-}"
    rm -f "${PID_FILE:-}"
    [[ -n "${LOCK_DIR:-}" ]] && rmdir "$LOCK_DIR"
}

trap cleanup EXIT

# Acquire resources
LOCK_DIR="$(mktemp -d /var/lock/myscript.XXXXXX)"
TEMP_DIR="$(mktemp -d)"
# ... work ...
```

## Signal-Aware Cleanup

```bash
cleanup_and_exit() {
    cleanup
    exit "${1:-1}"
}

trap 'cleanup_and_exit 1' SIGINT SIGTERM
trap cleanup EXIT
# EXIT fires after the signal handler, so both traps work together
```

## See Also

- [err-trap-errors](./err-trap-errors.md) - ERR trap for error handling
- [io-tempfile-safely](./io-tempfile-safely.md) - Using mktemp for temp files
