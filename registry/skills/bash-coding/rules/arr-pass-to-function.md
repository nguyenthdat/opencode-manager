# arr-pass-to-function

> Pass arrays by name with `declare -n` (nameref)

## Why It Matters

Bash doesn't support passing arrays as arguments directly — `"${arr[@]}"` expands to individual elements, losing the array identity. Namerefs (`declare -n`, `local -n`) allow functions to accept an array *by name*, operating on the original array without copying all elements. This is the idiomatic way to pass arrays to functions in Bash 4.3+.

## Bad

```bash
# Expanding array into positional params — loses array identity
process_files() {
    local -a files=("$@")    # Copy all elements (slow for large arrays)
    for f in "${files[@]}"; do
        echo "$f"
    done
}
declare -a my_files=(*.txt)
process_files "${my_files[@]}"

# Global variable — non-reusable
FILES=()
process_files() {
    for f in "${FILES[@]}"; do
        echo "$f"
    done
}
```

## Good

```bash
# Nameref: pass array by name, zero-copy
process_files() {
    local -n files_ref="$1"    # Nameref to the array
    local f
    for f in "${files_ref[@]}"; do
        echo "$f"
    done
}

declare -a my_files=(*.txt)
process_files my_files   # Pass array NAME, not elements

# Works with associative arrays too
print_config() {
    local -n config_ref="$1"
    local key
    for key in "${!config_ref[@]}"; do
        printf '%s = %s\n' "$key" "${config_ref[$key]}"
    done
}

declare -A settings=([host]=localhost [port]=5432)
print_config settings

# Modify array through nameref
append_unique() {
    local -n arr_ref="$1"
    local element="$2"
    local e
    for e in "${arr_ref[@]}"; do
        [[ "$e" == "$element" ]] && return 0
    done
    arr_ref+=("$element")
}

declare -a seen=()
append_unique seen "foo"
append_unique seen "foo"   # Not added again
```

## Warning: Nameref Name Collision

```bash
# If nameref name matches variable name in caller scope, it fails silently
process() {
    local -n arr="$1"          # If $1 is "arr" and caller has local arr...
    for item in "${arr[@]}"; do
        :
    done
}
# Call with unique names to avoid this!
```

## See Also

- [var-indirect-reference](./var-indirect-reference.md) - Nameref fundamentals
- [arr-expand-properly](./arr-expand-properly.md) - Array expansion
