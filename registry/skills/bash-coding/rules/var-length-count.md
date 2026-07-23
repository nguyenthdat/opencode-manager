# var-length-count

> Use `${#var}` for string length, `${#arr[@]}` for array size

## Why It Matters

Shell provides built-in length operators that work without forking to `wc`, `wc -l`, or `expr`. `${#var}` gives string length, `${#arr[@]}` gives array element count. These are faster and more portable than external commands, which may have different flags on different systems (e.g., `wc -c` vs `wc -m` for character count).

## Bad

```bash
# Forking to wc for length
len="$(echo -n "$str" | wc -c)"

# Forking to wc -l for array-like structure
count="$(echo "$items" | wc -l)"

# Using expr for length (POSIX but slow)
len="$(expr length "$str")"

# Counting lines of output
count="$(grep -c pattern "$file")"
```

## Good

```bash
# String length
str="hello world"
echo "${#str}"          # 11

# Array size
declare -a items=("a" "b" "c")
echo "${#items[@]}"     # 3 — number of elements

# Count positional parameters
echo "${#@}"            # Number of arguments

# Count associative array entries
declare -A map=([a]=1 [b]=2)
echo "${#map[@]}"       # 2

# Function to count lines in a variable (without forking)
count_lines() {
    local str="$1"
    local count=0
    local line
    while IFS= read -r line; do
        ((count++))
    done <<< "$str"
    echo "$count"
}
```

## See Also

- [arr-length-count](./arr-length-count.md) - Array-specific length operations
- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding subshell forks
