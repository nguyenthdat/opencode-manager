# arr-append-elements

> Use `arr+=("new")` to append to arrays

## Why It Matters

Bash provides the `+=` operator for appending to arrays, which is cleaner and less error-prone than manual index tracking. It handles sparse arrays correctly and avoids off-by-one errors. The `+=` operator can also append multiple elements at once, making batch additions efficient.

## Bad

```bash
declare -a items=()

# Manual index tracking — error-prone
items[0]="a"
items[1]="b"
items[2]="c"   # Must remember the index!

# Using length as next index — fragile
items[${#items[@]}]="d"   # Works but verbose

# Rebuilding entire array
items=("${items[@]}" "e")    # Subshell, slow, verbose
```

## Good

```bash
declare -a items=()

# Append single element
items+=("a")
items+=("b")
items+=("c")

# Append multiple elements at once
items+=("d" "e" "f")

# Append from expansion
items+=("${other_array[@]}")

# Append with conditional
[[ -f "special.txt" ]] && items+=("special.txt")

# Append command output (as a single element)
items+=("$(date -Iseconds)")

# Associative array: assign new key-value
declare -A config=()
config+=([key1]="value1")
config+=([key2]="value2")
```

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Declaring arrays
- [arr-expand-properly](./arr-expand-properly.md) - Expanding arrays correctly
