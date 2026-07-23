# anti-echo-in-function-output

> Don't echo debug info in functions that return data

## Why It Matters

Functions that return data via stdout (captured with `$(...)`) must not emit any other output to stdout — debug messages, progress indicators, or status lines will contaminate the captured data. This is the shell equivalent of a function that has both return values and side-effect output. Always send diagnostic output to stderr, not stdout.

## Bad

```bash
get_user_info() {
    echo "Querying database..."         # Contaminates stdout!
    local data
    data="$(db_query "SELECT * FROM users WHERE id=$1")"
    echo "Found: $(wc -l <<< "$data") lines"  # Also contaminates!
    echo "$data"
}

info="$(get_user_info 42)"             # Now contains debug messages AND data
echo "$info"                            # Useless for parsing
```

## Good

```bash
get_user_info() {
    echo "Querying database..." >&2         # Debug on stderr
    local data
    data="$(db_query "SELECT * FROM users WHERE id=$1")" 2>/dev/null
    echo "Found: $(wc -l <<< "$data") lines" >&2  # Status on stderr
    echo "$data"                             # Data on stdout
}

info="$(get_user_info 42)"                  # Pure data
echo "Got info for $info"                   # Clean

# A verbose flag controls debug output
get_user_info() {
    local user_id="$1"
    ((VERBOSE)) && echo "Looking up user ${user_id}" >&2
    db_query "SELECT * FROM users WHERE id=${user_id}"
}
```

## See Also

- [debug-no-echo-debug](./debug-no-echo-debug.md) - Debug on stderr
- [fn-return-values](./fn-return-values.md) - Returning values from functions
