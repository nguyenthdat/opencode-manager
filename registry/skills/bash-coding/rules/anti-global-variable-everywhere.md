# anti-global-variable-everywhere

> Don't use global variables for everything

## Why It Matters

Excessive global variables create hidden dependencies between functions, make code impossible to test in isolation, and lead to "spooky action at a distance" bugs. A function that relies on 10 global variables cannot be understood from its signature alone. Pass data as arguments and return results via stdout — shell functions should look like Unix filters.

## Bad

```bash
# Functions silently depend on and modify globals
CONFIG_FILE="" DB_HOST="" DB_PORT="" LOG_LEVEL=""
OUTPUT_DIR="" PROCESSED_COUNT=0 VERBOSE=false

process() {
    # Uses 7 globals — completely opaque from the call site
    cat "$CONFIG_FILE" | grep "$DB_HOST" > "$OUTPUT_DIR/config"
    ((PROCESSED_COUNT++))
    [[ "$VERBOSE" ]] && echo "Done"
}

# Caller must set all globals in the right order
CONFIG_FILE="/etc/app.conf"
DB_HOST="localhost"
# ... forgot OUTPUT_DIR — process() fails mysteriously!
process
```

## Good

```bash
# Explicit dependencies — self-documenting
process_config() {
    local config_file="$1"
    local db_host="$2"
    local output_dir="$3"
    local verbose="${4:-false}"

    grep "$db_host" "$config_file" > "${output_dir}/config"
    [[ "$verbose" == "true" ]] && echo "Processed config" >&2
}

# Read-only globals for true constants are acceptable
readonly DEFAULT_HOST="localhost"
readonly MAX_RETRIES=3

# Call site is clear about what it passes
process_config "/etc/app.conf" "$DEFAULT_HOST" "/tmp/output" "true"
```

## See Also

- [fn-pure-when-possible](./fn-pure-when-possible.md) - Pure function design
- [name-globals-caps](./name-globals-caps.md) - Naming globals when necessary
