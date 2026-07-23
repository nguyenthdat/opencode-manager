# err-set-e-cautious

> Understand `set -e` edge cases in conditionals

## Why It Matters

`set -e` (errexit) is not a catch-all error handler. It has well-documented edge cases: commands in `if`/`while`/`until` conditionals do NOT trigger errexit, nor do commands in `&&`/`||` chains, command substitutions, or background processes. Understanding these exceptions prevents false confidence and ensures errors are caught where they matter.

## Bad

```bash
#!/usr/bin/env bash
set -e

# errexit does NOT catch this — grep in conditional
if grep "error" "$log"; then
    echo "Found error"
fi
# grep exit code 2 (file not found) is NOT treated as an exit condition

# Command substitution also ignores errexit
result="$(failing_command)"  # errexit not triggered!
echo "Result: $result"

# Background commands — errexit never fires
slow_task &  # Runs silently, failure ignored

# The classic trap: let var=$(cmd)
let "x = 1 +"  # Syntax error, but errexit doesn't fire on let
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

# Option 1: Don't use grep in conditionals
grep "error" "$log"
if (( $? == 0 )); then
    echo "Found error"
elif (( $? == 1 )); then
    echo "No error"
else
    echo "grep failed (exit code >1)" >&2
    exit 1
fi

# Option 2: Capture output then check
if output="$(failing_command 2>&1)"; then
    echo "Success: $output"
else
    status=$?
    echo "Failed with $status: $output" >&2
    exit "$status"
fi

# Option 3: Use pipefail to catch command substitution failures
set -o pipefail
if result="$(set -o pipefail; may_fail | transform)"; then
    echo "$result"
fi

# Background: explicit wait and check
slow_task &
slow_pid=$!
wait "$slow_pid" || {
    echo "Background task failed!" >&2
    exit 1
}
```

## Errexit Edge Cases Summary

| Context | errexit triggers? |
|---------|-------------------|
| `if cmd; then` | No |
| `while cmd; do` | No |
| `until cmd; do` | No |
| `cmd \|\| other` | No (left side) |
| `cmd && other` | No (left side) |
| `var=$(cmd)` | No |
| `cmd &` | No |
| `! cmd` | Never |

## See Also

- [err-errexit-set](./err-errexit-set.md) - Setting errexit properly
- [err-pipefail-required](./err-pipefail-required.md) - Pipefail for pipelines
