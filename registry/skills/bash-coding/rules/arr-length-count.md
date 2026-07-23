# arr-length-count

> Use `${#arr[@]}` for array length

## Why It Matters

`${#arr[@]}` returns the number of elements in an array, while `${#arr}` returns the length of the first element (or 0 if array is empty). Confusing these two is a common source of off-by-one bugs and incorrect size calculations. Always use `[@]` when counting array elements.

## Bad

```bash
declare -a items=("abc" "defgh" "ij")

# Wrong: returns length of first element
echo "${#items}"         # 3 (length of "abc")

# Wrong: reports length of first index only
echo "${#items[0]}"      # 3

# Wrong: word-split, each word counted
echo "${#items[*]}"      # May not work as expected
```

## Good

```bash
declare -a items=("abc" "defgh" "ij")

# Correct: number of elements
echo "${#items[@]}"      # 3

# Associative array: number of key-value pairs
declare -A config=([a]=1 [b]=2 [c]=3)
echo "${#config[@]}"     # 3

# Combined with conditional
if ((${#items[@]} == 0)); then
    echo "No items to process"
fi

# Use in loops
for ((i = 0; i < ${#items[@]}; i++)); do
    echo "Item $i: ${items[$i]}"
done
```

## Length Quick Reference

| Expression | Meaning |
|-----------|---------|
| `${#var}` | Length of string `$var` |
| `${#arr[@]}` | Number of elements in array `arr` |
| `${#arr[*]}` | Same as `@` form (element count) |
| `${#arr[0]}` | Length of first array element |

## See Also

- [var-length-count](./var-length-count.md) - String length and array size
- [arr-declare-arrays](./arr-declare-arrays.md) - Array declarations
