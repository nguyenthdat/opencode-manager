# debug-set-x-trace

> Use `set -x` for command tracing; wrap in subshell

## Why It Matters

`set -x` prints each command before execution, showing expanded variables — invaluable for debugging. However, it produces noisy output and should be scoped to the problematic code section. Wrapping it in a subshell `(set -x; ...)` ensures tracing is enabled only for the relevant commands and doesn't leak to the rest of the script.

## Bad

```bash
#!/usr/bin/env bash
# Global set -x — extremely noisy
set -x

for file in *.txt; do
    process "$file"
done
# Hundreds of trace lines for repeated commands
```

## Good

```bash
#!/usr/bin/env bash

# Only trace the specific section that's failing
process_file() {
    local file="$1"
    (
        set -x
        # Trace only these specific commands
        transform "$file" > "${file}.tmp"
        mv "${file}.tmp" "$file"
    )
    # Tracing turns off at subshell exit
    verify "$file"
}

# Conditional tracing based on verbosity
if "$DEBUG"; then
    set -x
fi
do_something
if "$DEBUG"; then
    set +x
fi

# Or use a function
debug_section() {
    if [[ "${DEBUG_TRACE:-}" ]]; then
        set -x
    fi
    "$@"   # Run commands with optional tracing
    { set +x; } 2>/dev/null
}
debug_section critical_operation arg1 arg2
```

## set -x Output Format

```bash
# Customize trace prefix with PS4
export PS4='+(${BASH_SOURCE}:${LINENO}): ${FUNCNAME[0]:+${FUNCNAME[0]}(): }'

set -x
name="world"
echo "Hello, ${name}"
# Trace output:
# +(script.sh:10): name=world
# +(script.sh:11): echo 'Hello, world'
```

## See Also

- [debug-ps4-enhanced](./debug-ps4-enhanced.md) - Better trace formatting
- [debug-verbose-flag](./debug-verbose-flag.md) - Verbose output flag
