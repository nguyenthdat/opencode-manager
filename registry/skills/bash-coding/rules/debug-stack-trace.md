# debug-stack-trace

> Print stack trace in ERR trap with `caller`

## Why It Matters

When a script fails deep in a call stack, a bare error message tells you what failed but not how you got there. Printing a stack trace using `caller` in the ERR trap shows the full call chain: which function called which, from which file and line number. This turns cryptic failures into instantly debuggable stack traces.

## Bad

```bash
#!/usr/bin/env bash
set -euo pipefail

# Error happens deep in call stack — no context
helper() {
    false   # Error: bare "command not found" or exit code
}
middle() { helper; }
top() { middle; }
top
# Output: (nothing, just exits with error code 1)
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

on_error() {
    local exit_code=$?
    local frame=0
    echo "ERROR: Command failed with exit code ${exit_code}" >&2
    echo "Stack trace:" >&2
    while caller "$frame"; do
        ((frame++))
    done
    exit "$exit_code"
}

trap on_error ERR

helper() { false; }
middle() { helper; }
top() { middle; }
top

# Output:
# ERROR: Command failed with exit code 1
# Stack trace:
# 23 helper script.sh      <- line 23 in helper()
# 24 middle script.sh      <- called from line 24 in middle()
# 25 top script.sh         <- called from line 25 in top()
# 26 main script.sh        <- called from line 26 in main()
```

## Enhanced Stack Trace

```bash
on_error() {
    local exit_code=$?
    echo "========================================" >&2
    echo "ERROR: Exit code ${exit_code}" >&2
    echo "----------------------------------------" >&2
    local frame=0
    local fn="" ln="" src=""
    echo "Call stack (most recent first):" >&2
    while IFS=' ' read -r ln fn src < <(caller "$frame"); do
        printf '  #%d %s() at %s:%s\n' "$frame" "$fn" "$src" "$ln" >&2
        ((frame++))
    done
    echo "========================================" >&2
    exit "$exit_code"
}
```

## `caller` Output Format

```bash
# caller N outputs: line_number subroutine_name source_file
# caller 0: "12 my_func script.sh"  <- most recent call
# caller 1: "25 other_func script.sh"
# caller 2: "30 main script.sh"
# caller N returns non-zero when past the top of the stack
```

## See Also

- [err-trap-errors](./err-trap-errors.md) - Error trap
- [debug-ps4-enhanced](./debug-ps4-enhanced.md) - Better trace formatting
