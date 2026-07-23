# err-trap-errors

> Use `trap '...' ERR` for error handling

## Why It Matters

`set -e` only exits — it provides no logging, cleanup, or context on failure. `trap '...' ERR` executes custom code whenever a command exits with non-zero status, enabling consistent error logging, stack traces, and cleanup actions. Combined with `set -e`, it creates a robust error handling system.

## Bad

```bash
#!/usr/bin/env bash
set -e

# Error happens, script exits — no context, no cleanup
build_project
deploy_to_server
cleanup_temp_files  # Never reached if build fails
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

on_error() {
    local exit_code=$?
    local line_no=$1
    echo "ERROR: Command failed at line ${line_no} with exit code ${exit_code}" >&2
    cleanup_temp_files
    exit "$exit_code"
}

trap 'on_error ${LINENO}' ERR
trap 'cleanup_temp_files' EXIT

build_project
deploy_to_server
```

## Multiple Traps

```bash
#!/usr/bin/env bash
set -euo pipefail

cleanup() {
    rm -rf "${TEMP_DIR:-}"
    echo "Cleaned up"
}

on_error() {
    echo "Error on line $1: command exited with $?" >&2
    # cleanup is called by EXIT trap automatically
}

trap 'on_error ${LINENO}' ERR
trap cleanup EXIT

# ERR trap fires on non-zero exit
# EXIT trap always fires at script end
```

## SIGINT and SIGTERM Handling

```bash
cleanup_and_exit() {
    echo "Received signal, cleaning up..." >&2
    rm -rf "$TEMP_DIR"
    exit 1
}

trap cleanup_and_exit SIGINT SIGTERM
```

## See Also

- [err-trap-exit-cleanup](./err-trap-exit-cleanup.md) - EXIT trap for cleanup
- [debug-stack-trace](./debug-stack-trace.md) - Stack traces in error handlers
