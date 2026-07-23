# name-variables-lowercase-local

> lowercase_with_underscores for local vars

## Why It Matters

Local variables in functions should be clearly distinguishable from environment variables and constants. Using `lowercase_with_underscores` (snake_case) creates a visual hierarchy: `UPPER_CASE` = global/shared, `lowercase` = local/scoped. This convention prevents accidental modification of environment variables and makes function scope boundaries obvious.

## Bad

```bash
my_function() {
    # UPPER_CASE looks like environment/global — misleading
    local DB_HOST="$1"
    local PORT_NUMBER="$2"
    local LOG_FILE="/var/log/app"

    # Single letter or cryptic names
    local f="$1"         # What is f?
    local x="$2"         # What does x represent?
    local tmp="$3"       # Too vague
}
```

## Good

```bash
my_function() {
    # lowercase_with_underscores for locals
    local db_host="$1"
    local port_number="$2"
    local log_file="/var/log/app"

    # Descriptive names
    local input_filename="$1"
    local retry_count="$2"
    local temp_dir="${3:-/tmp}"

    # Loop counters — single letter is acceptable
    local i
    for ((i = 0; i < 10; i++)); do
        process "$i"
    done

    # "Private" locals with underscore prefix
    local _saved_ifs="$IFS"
    IFS=:
    local _result=""
    IFS="$_saved_ifs"
}
```

## See Also

- [name-variables-uppercase-env](./name-variables-uppercase-env.md) - UPPER_CASE for env vars
- [name-temp-vars-prefix](./name-temp-vars-prefix.md) - Prefixing temp variables
