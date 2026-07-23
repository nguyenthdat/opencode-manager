# debug-log-function

> Write a `log()` function with timestamps and levels

## Why It Matters

Ad-hoc `echo` statements are inconsistent, lack context (timestamps, severity), and can't be globally toggled on/off. A structured `log()` function provides consistent formatting, log levels (DEBUG, INFO, WARN, ERROR), timestamps, and the ability to redirect to files or stderr. This single function replaces dozens of ad-hoc echo calls.

## Bad

```bash
#!/usr/bin/env bash

echo "Starting process..."
echo "ERROR: Something went wrong"
echo "Processing file: $file"   # Is this debug or info?

# No way to control verbosity
echo "Debug: got value $x"    # Always prints
```

## Good

```bash
#!/usr/bin/env bash

# Log levels
declare LOG_LEVEL="${LOG_LEVEL:-INFO}"

log() {
    local level="$1"
    shift
    local msg="$*"

    # Level priority: DEBUG=0, INFO=1, WARN=2, ERROR=3
    local -A levels=([DEBUG]=0 [INFO]=1 [WARN]=2 [ERROR]=3)
    local current_priority="${levels[${LOG_LEVEL}]:-1}"
    local msg_priority="${levels[${level}]:-1}"

    if ((msg_priority < current_priority)); then
        return
    fi

    local ts
    ts="$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')"

    case "$level" in
        ERROR) printf '[%s] %-5s %s\n' "$ts" "$level" "$msg" >&2 ;;
        WARN)  printf '[%s] %-5s %s\n' "$ts" "$level" "$msg" >&2 ;;
        *)     printf '[%s] %-5s %s\n' "$ts" "$level" "$msg" ;;
    esac
}

# Usage
log INFO "Starting process..."
log DEBUG "Iteration $i, value=$x"
log WARN "Disk usage at ${usage}%"
log ERROR "Failed to connect to database: $err"
```

## Log Level Usage

```bash
# Control via environment
LOG_LEVEL=DEBUG ./myscript.sh    # Show everything
LOG_LEVEL=WARN ./myscript.sh     # Only warnings and errors
LOG_LEVEL=ERROR ./myscript.sh    # Only errors

# In script:
log DEBUG "Detailed variable state"    # Only with LOG_LEVEL=DEBUG
log INFO "Starting backup"             # Default and above
log WARN "Retry attempt ${i}"          # WARN and above
log ERROR "Backup failed"             # Always shown
```

## See Also

- [debug-verbose-flag](./debug-verbose-flag.md) - Verbose flag pattern
- [debug-no-echo-debug](./debug-no-echo-debug.md) - Stderr for debug output
