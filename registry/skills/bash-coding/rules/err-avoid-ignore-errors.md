# err-avoid-ignore-errors

> Don't use `|| true` to ignore errors without comment

## Why It Matters

`|| true` suppresses all error information — exit code, stderr, and the signal that something went wrong. While sometimes legitimate (e.g., `rm -f` on a file that may not exist), it should be used sparingly and always with an explanatory comment. Uncommented `|| true` is a code smell that often hides real bugs.

## Bad

```bash
set -e

# Silently suppressing all errors — dangerous
rm -rf "$TEMP_DIR" || true        # What if TEMP_DIR is unset? Still "succeeds"
mount /backup || true             # Mount failure silently ignored — data loss!
database_migration || true        # Migration failed? Nobody knows.

# Chained true — error context completely lost
critical_setup_step || true
```

## Good

```bash
set -e

# Comment why failure is acceptable
rm -f "$LOCK_FILE" || true  # Lock file may not exist — that's fine

# Use explicit error handling instead
if ! mount /backup; then
    echo "Warning: backup volume not available; skipping backup" >&2
    # Don't exit — backup is optional, but at least log it
fi

# Capture and decide
if ! database_migration; then
    echo "Migration failed — checking if already applied..." >&2
    if verify_schema_version; then
        echo "Migration already applied; continuing" >&2
    else
        echo "FATAL: Migration failed and schema is wrong" >&2
        exit 1
    fi
fi

# Temporarily disable errexit for a specific block
set +e
cleanup_command
cleanup_status=$?
set -e
if (( cleanup_status != 0 )); then
    echo "Cleanup failed (non-fatal): status ${cleanup_status}" >&2
fi
```

## Acceptable Uses of || true

```bash
# 1. File removal (file may not exist)
rm -f "$pid_file" || true

# 2. Terminating a process that may already be dead
kill -0 "$pid" 2>/dev/null || true

# 3. Cleaning up optional resources
docker rm "$container" 2>/dev/null || true

# Always add a comment explaining WHY it's acceptable
```

## See Also

- [err-errexit-set](./err-errexit-set.md) - The errexit option
- [anti-interactive-suppress](./anti-interactive-suppress.md) - Related anti-pattern
