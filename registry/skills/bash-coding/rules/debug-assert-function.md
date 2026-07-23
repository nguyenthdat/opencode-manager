# debug-assert-function

> Create `assert()` helper for runtime checks

## Why It Matters

Runtime assertions validate invariants and catch programming errors early. Unlike `set -e` (which only catches exit codes), `assert()` can check arbitrary conditions, print the failing expression and location, and provide a stack trace. This turns silent logic errors into loud, debuggable failures — especially valuable in complex scripts.

## Bad

```bash
#!/usr/bin/env bash

# No runtime checks — silent corruption possible
process_data() {
    local input="$1"
    local output="$2"
    # What if input is empty? Output directory doesn't exist?
    transform "$input" > "$output"
}

# Manual check — verbose, inconsistent
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "OUTPUT_DIR must exist" >&2
    exit 1
fi
```

## Good

```bash
#!/usr/bin/env bash

assert() {
    local condition="$1"
    local message="${2:-Assertion failed}"
    if ! eval "$condition"; then
        echo "ASSERT FAILED [${BASH_SOURCE[1]}:${BASH_LINENO[0]}]: ${condition}" >&2
        echo "  ${message}" >&2
        exit 1
    fi
}

assert_not_empty() {
    local value="$1"
    local name="$2"
    if [[ -z "$value" ]]; then
        echo "ASSERT FAILED: ${name} must not be empty" >&2
        echo "  at ${BASH_SOURCE[1]}:${BASH_LINENO[0]}" >&2
        exit 1
    fi
}

process_data() {
    local input="$1"
    local output="$2"
    assert_not_empty "$input" "input file"
    assert_not_empty "$output" "output file"
    assert '[[ -f "$input" ]]' "Input file does not exist: ${input}"
    assert '[[ -d "$(dirname "$output")" ]]' "Output directory missing"
    transform "$input" > "$output"
}
```

## Assertion Patterns

```bash
# Basic assertions
assert '[[ -n "$var" ]]' "Variable is empty"
assert '(( x > 0 ))' "x must be positive"
assert '[[ -f "$file" ]]' "File not found: ${file}"

# With eval-based evaluation (handles variables naturally)
assert '[[ "${#items[@]}" -gt 0 ]]' "Array must not be empty"

# Skip assertions in production
if [[ "${PRODUCTION:-}" ]]; then
    assert() { :; }   # No-op
fi
```

## See Also

- [err-trap-errors](./err-trap-errors.md) - Error handling
- [debug-stack-trace](./debug-stack-trace.md) - Stack traces in errors
