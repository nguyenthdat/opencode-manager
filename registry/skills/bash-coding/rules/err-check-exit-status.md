# err-check-exit-status

> Check `$?` after critical commands

## Why It Matters

Even with `set -e`, certain contexts (conditionals, pipelines without pipefail, background commands) don't trigger automatic exit. For commands whose failure is critical but may not be caught by `set -e` — like `grep` in an `if` statement, or background jobs — explicitly checking `$?` provides a clear audit trail and prevents silent failures.

## Bad

```bash
set -e

# grep is in a conditional; errexit doesn't apply
# Failure returns 1 which is "false" — branch skipped silently
if grep -q "ERROR" "$log"; then
    send_alert
fi
# What if grep failed with exit code 2 (file not found)?

# Command substitution — errexit doesn't propagate
result="$(possibly_failing_command)"

# Background process — exit status lost
long_running_task &
wait  # Doesn't check exit code by default
```

## Good

```bash
set -euo pipefail

# Explicit exit status check for grep
grep -q "ERROR" "$log"
grep_status=$?
if (( grep_status == 0 )); then
    send_alert
elif (( grep_status > 1 )); then
    echo "grep error: file not found or permission denied" >&2
    exit 1
fi

# Capture output and check status separately
if result="$(possibly_failing_command 2>&1)"; then
    echo "Success: $result"
else
    status=$?
    echo "Failed with $status" >&2
    exit "$status"
fi

# Check background process
long_running_task &
bg_pid=$!
# ... other work ...
wait "$bg_pid" || {
    echo "Background task failed with $?" >&2
    exit 1
}
```

## Exit Code Conventions

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Misuse of shell builtins |
| 126 | Command cannot execute |
| 127 | Command not found |
| 128+N | Killed by signal N |
| 130 | Ctrl+C (SIGINT = 2, 128+2) |

## See Also

- [err-meaningful-exit](./err-meaningful-exit.md) - Meaningful exit codes
- [err-return-over-exit-fn](./err-return-over-exit-fn.md) - Return in functions vs exit
