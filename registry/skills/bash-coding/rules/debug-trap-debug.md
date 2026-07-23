# debug-trap-debug

> Use `trap '...' DEBUG` for custom debugging

## Why It Matters

The `DEBUG` trap (capitalized — not `debug`) fires before every command in the script, enabling custom debugging logic: profiling (timing each command), conditional breakpoints, step-through execution, or logging every command with context. It's a powerful debugging tool when `set -x` output isn't sufficient.

## Bad

```bash
#!/usr/bin/env bash

# Ad-hoc echo debugging — scattered, hard to remove
echo "DEBUG: about to call process_data"
process_data
echo "DEBUG: process_data returned $?"
echo "DEBUG: entering loop"
for f in *.txt; do
    echo "DEBUG: processing $f"
    transform "$f"
done
```

## Good

```bash
#!/usr/bin/env bash

# Custom debug trap — consistent, toggleable
debug_trace() {
    if [[ "${DEBUG:-}" ]]; then
        echo "[DEBUG] ${BASH_SOURCE[1]}:${BASH_LINENO[0]}: ${BASH_COMMAND}" >&2
    fi
}
trap debug_trace DEBUG

# Or: step-through execution
step_debug() {
    echo "Executing: ${BASH_COMMAND}" >&2
    read -r -p "Press Enter to continue (q to quit)... " answer
    [[ "$answer" == "q" ]] && { trap - DEBUG; echo "Debugging stopped"; }
}
trap step_debug DEBUG
```

## Timing with DEBUG Trap

```bash
# Profile script execution
declare -A _timing

timing_start() {
    _timing_start_time="${EPOCHREALTIME:-$(date +%s.%N)}"
}

timing_record() {
    local end_time="${EPOCHREALTIME:-$(date +%s.%N)}"
    local duration
    duration="$(bc <<< "${end_time} - ${_timing_start_time}")"
    echo "[TIMING] ${duration}s: ${BASH_COMMAND}" >&2
    _timing_start_time="$end_time"
}

trap timing_start DEBUG
trap timing_record DEBUG
```

## See Also

- [debug-set-x-trace](./debug-set-x-trace.md) - set -x tracing
- [debug-stack-trace](./debug-stack-trace.md) - Stack traces
