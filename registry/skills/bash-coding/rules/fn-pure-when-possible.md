# fn-pure-when-possible

> Write functions that don't depend on global state

## Why It Matters

Functions that depend on global variables are hard to test (you must set up global state), hard to reason about (side effects anywhere), and hard to reuse (global variable name collisions). Pure functions — those that only use their arguments and local variables — are predictable, testable, and composable. Minimize global state dependencies.

## Bad

```bash
# Depends on global $CONFIG_DIR — not obvious from signature
load_config() {
    cat "${CONFIG_DIR}/app.conf"   # Where does CONFIG_DIR come from?
}

# Modifies global state silently
counter=0
increment() {
    ((counter++))     # Side effect hidden in function
}

# Multiple global dependencies
send_notification() {
    # Depends on $SMTP_HOST, $SMTP_PORT, $FROM_EMAIL, $TO_EMAIL — all global
    mail -s "$SUBJECT" -S smtp="${SMTP_HOST}:${SMTP_PORT}" \
        -r "$FROM_EMAIL" "$TO_EMAIL" <<< "$BODY"
}
```

## Good

```bash
# All dependencies passed as arguments
load_config() {
    local config_dir="$1"
    cat "${config_dir}/app.conf"
}

# Return new value instead of mutating global
increment() {
    local value="$1"
    echo "$((value + 1))"
}
counter="$(increment "$counter")"

# All parameters explicit
send_notification() {
    local smtp_host="$1"
    local smtp_port="$2"
    local from_email="$3"
    local to_email="$4"
    local subject="$5"
    local body="$6"

    mail -s "$subject" -S smtp="${smtp_host}:${smtp_port}" \
        -r "$from_email" "$to_email" <<< "$body"
}

# If globals are truly necessary, document them
# Reads: $APP_CONFIG (global, set by main())
# Writes: $APP_STATUS (global, read by report())
process_data() {
    local input="$1"
    # Intentionally uses global APP_CONFIG
    local data_dir="${APP_CONFIG}/data"
    # ...
}
```

## When Globals Are Acceptable

```bash
# 1. Constants (readonly)
readonly MAX_RETRIES=3
retry_command() { for ((i=0; i<MAX_RETRIES; i++)); do ...; done; }

# 2. Configuration loaded once at startup
readonly CONFIG
main() { CONFIG="$(load_config)"; do_all; }

# 3. Counters/accumulators when performance-critical
# (But prefer local variables and return values when possible)
```

## See Also

- [fn-no-side-effects](./fn-no-side-effects.md) - Minimizing side effects
- [var-local-in-functions](./var-local-in-functions.md) - Local variable scope
