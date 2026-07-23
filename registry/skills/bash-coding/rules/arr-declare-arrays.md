# arr-declare-arrays

> Use `declare -a` for indexed, `declare -A` for associative

## Why It Matters

Bash offers both indexed arrays (integer keys) and associative arrays (string keys). Using the correct declaration makes intent clear and prevents subtle bugs — assigning to an undeclared variable with `[key]` syntax may create a string instead of an array. Explicit declarations also help ShellCheck catch misuse.

## Bad

```bash
# Undeclared array — ShellCheck warns, behavior may surprise
items[0]="a"             # Creates array, but not explicit
items[1]="b"

# Associative array without declare -A — treated as indexed
map["key"]="value"       # key is evaluated as 0 (arithmetic)

# Global array inside function leaks
populate() {
    files=(*.txt)        # Creates global array files
}
```

## Good

```bash
# Explicit declaration — clear intent, no surprises
declare -a items=("a" "b" "c")
declare -a empty_array=()

# Associative arrays must be declared with -A
declare -A config=(
    [host]="localhost"
    [port]="5432"
    [database]="myapp"
)

# Append to array
items+=("d" "e")

# Local array in function
populate() {
    local -a files
    files=(*.txt)
    echo "${files[@]}"
}

# Readonly array
declare -r -a VALID_ACTIONS=("start" "stop" "restart")

# Integer-indexed with declare
declare -ai counts    # Integer-indexed array
```

## Declaration Quick Reference

| Declaration | Type | Example |
|-------------|------|---------|
| `declare -a` | Indexed array | `arr[0]="value"` |
| `declare -A` | Associative array | `arr[key]="value"` |
| `declare -i` | Integer (single var) | `((x = 5 + 3))` |
| `declare -r` | Readonly | Cannot reassign |
| `declare -l` | Lowercase (single var) | Value always lowercase |
| `declare -u` | Uppercase (single var) | Value always uppercase |

## See Also

- [arr-expand-properly](./arr-expand-properly.md) - Expanding arrays correctly
- [var-arrays-cautious](./var-arrays-cautious.md) - Using arrays for lists
