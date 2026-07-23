# fn-no-side-effects

> Minimize side effects; document globals modified

## Why It Matters

A function with side effects (modifying global variables, files, or system state) is harder to reason about because its behavior depends on and affects hidden state. When side effects are necessary (shell scripts exist to have side effects), document them clearly so callers know what to expect. Keep side-effect-free functions separate from state-mutating ones.

## Bad

```bash
# Hidden side effects undocumented
process_file() {
    local file="$1"
    # Silently modifies global RESULT
    RESULT="$(cat "$file" | wc -l)"
    # Silently creates temp file
    TMP="$(mktemp)"
    # Silently changes directory
    cd "$OUTPUT_DIR"
    transform "$file" > "$TMP"
    mv "$TMP" "$file"
}

# Caller has no idea what changed
process_file "data.txt"
echo "$RESULT"     # Where did this come from?
cd -               # Where am I now?
```

## Good

```bash
# Document all side effects
# Side effects: Modifies global $PROCESSED_COUNT
# Creates files in $OUTPUT_DIR
# Reads: global $OUTPUT_DIR
process_file() {
    local file="$1"
    local tmp

    # Use local variables to avoid global pollution
    tmp="$(mktemp)" || return 1
    trap 'rm -f "$tmp"' RETURN

    local line_count
    line_count="$(wc -l < "$file")"

    # Write to global (documented) and echo for composability
    PROCESSED_COUNT="$((PROCESSED_COUNT + line_count))"

    # Use subshell to avoid cd side effect
    (
        cd "$OUTPUT_DIR" || exit 1
        transform "$file" > "$tmp"
        mv "$tmp" "$file"
    )
    echo "$line_count"   # Return value via stdout
}

# Pure functions mixed with state-mutating ones
# Pure: no side effects
is_valid_file() { [[ -f "$1" && -s "$1" ]]; }

# Side-effect: modifies global accumulator
add_to_total() { TOTAL=$((TOTAL + $1)); }
```

## Side Effect Documentation Template

```bash
# Function: create_backup
# Arguments: source_dir dest_dir
# Side effects:
#   - Creates tar archive in $dest_dir
#   - Appends to log file: /var/log/backup.log
#   - Modifies global: $LAST_BACKUP_TIME
# Reads:
#   - $BACKUP_EXCLUDE_PATTERNS (global)
#   - $COMPRESSION_LEVEL (global)
```

## See Also

- [fn-pure-when-possible](./fn-pure-when-possible.md) - Writing pure functions
- [fn-small-focused](./fn-small-focused.md) - Keeping functions small
