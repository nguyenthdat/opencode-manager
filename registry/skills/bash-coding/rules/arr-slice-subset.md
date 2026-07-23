# arr-slice-subset

> Use `${arr[@]:offset:length}` for array slicing

## Why It Matters

Array slicing extracts a contiguous range of elements without a loop, providing clean syntax for "first N items," "skip first N," or "take a window." It's a built-in Bash operation (no fork, no loop) that works with both indexed and positional parameters. Use it instead of manual indexing loops.

## Bad

```bash
declare -a items=(a b c d e f g)

# Manual loop for first 3 items — verbose
declare -a first_three=()
for ((i = 0; i < 3 && i < ${#items[@]}; i++)); do
    first_three+=("${items[$i]}")
done

# Manual loop to skip first 2
declare -a rest=()
for ((i = 2; i < ${#items[@]}; i++)); do
    rest+=("${items[$i]}")
done

# Using external tools
head -3 < <(printf '%s\n' "${items[@]}")   # Fork, slow
```

## Good

```bash
declare -a items=(a b c d e f g)

# First 3 elements
declare -a first_three=("${items[@]:0:3}")     # (a b c)

# Skip first 2, take rest
declare -a rest=("${items[@]:2}")               # (c d e f g)

# Slice from middle
declare -a middle=("${items[@]:2:3}")           # (c d e)

# Last N elements (using negative offset)
declare -a last_two=("${items[@]: -2}")         # (f g) — note the space!

# Works with positional parameters too
set -- a b c d e f g
echo "${@:3:2}"    # c d
```

## Slice Syntax

```bash
${arr[@]:offset:length}    # Indexed array slice
${arr[@]:offset}           # All elements from offset to end
${arr[@]: -n}              # Last n elements (space before -n is required!)
${@:offset:length}         # Positional parameter slice
${*:offset:length}         # Positional parameter slice (joined)
```

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Array declarations
- [var-prefix-suffix-remove](./var-prefix-suffix-remove.md) - String slicing
