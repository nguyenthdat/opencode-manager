# var-arrays-cautious

> Use arrays for lists; don't misuse strings with spaces

## Why It Matters

Storing lists of items in a plain string leads to word splitting bugs with filenames containing spaces, newlines, or special characters. Bash arrays (`declare -a`) and associative arrays (`declare -A`) properly store each element as a separate entry, allowing safe iteration, expansion, and manipulation regardless of element content.

## Bad

```bash
# Space-delimited string — breaks on filenames with spaces
files="a.txt b.txt my file.txt"
for f in $files; do
    echo "$f"   # "my" and "file.txt" are separate iterations!
done

# Command substitution into string — similar problem
files="$(ls *.txt)"
echo "$files"   # All files on one line; impossible to iterate safely

# Deleting items by string manipulation
paths="/usr/bin:/usr/local/bin"
paths="${paths/\/usr\/bin:}"  # Fragile, error-prone
```

## Good

```bash
# Bash: use arrays
declare -a files=("a.txt" "b.txt" "my file.txt")
for f in "${files[@]}"; do
    echo "$f"   # Each filename is a single element — correct!
done

# Append to array
files+=("another file.txt")

# Build array from glob (safe — no word splitting on expansion)
shopt -s nullglob
declare -a txt_files=(*.txt)

# Remove items by index or value
unset 'files[0]'
new_files=("${files[@]}")
for f in "${new_files[@]}"; do
    [[ "$f" != "skip.txt" ]] || continue
    result+=("$f")
done

# Pass arrays by name with nameref
process_files() {
    local -n arr="$1"
    for f in "${arr[@]}"; do
        process "$f"
    done
}
```

## POSIX Alternative (No Arrays)

```bash
# Use IFS-delimited strings with care
IFS=':'
set -- /usr/bin /usr/local/bin
for path in "$@"; do
    echo "$path"
done

# Or use newline separation with find
find . -name "*.txt" -print0 | while IFS= read -r -d '' file; do
    process "$file"
done
```

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Declaring arrays
- [arr-expand-properly](./arr-expand-properly.md) - Expanding arrays safely
- [port-array-alternatives](./port-array-alternatives.md) - POSIX alternatives to arrays
