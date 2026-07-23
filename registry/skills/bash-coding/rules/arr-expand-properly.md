# arr-expand-properly

> Use `"${arr[@]}"` to expand arrays with proper quoting

## Why It Matters

Array expansion syntax is subtle: `${arr[*]}` joins all elements into a single string (subject to word splitting), while `"${arr[@]}"` expands each element as a separate quoted word. Using the wrong form causes elements with spaces to split incorrectly. `"${arr[@]}"` is almost always what you want when passing array elements to a command or loop.

## Bad

```bash
declare -a files=("file 1.txt" "file 2.txt" "file 3.txt")

# WRONG: expands as single string, word splits on spaces
for f in ${files[*]}; do
    echo "$f"   # Prints "file", "1.txt", "file", "2.txt", etc.
done

# WRONG: unquoted @ also word splits
cp ${files[@]} dest/    # cp gets 6 arguments, not 3

# WRONG: quoted * joins into single string
echo "${files[*]}"      # "file 1.txt file 2.txt file 3.txt"
```

## Good

```bash
declare -a files=("file 1.txt" "file 2.txt" "file 3.txt")

# CORRECT: each element as a separate quoted word
for f in "${files[@]}"; do
    echo "$f"   # Prints: "file 1.txt", "file 2.txt", "file 3.txt"
done

# CORRECT: pass as arguments
cp "${files[@]}" dest/

# CORRECT: print with separators
printf '%s\n' "${files[@]}"

# CORRECT: pass to function
process_files "${files[@]}"
```

## Expansion Reference

```bash
arr=("a b" "c d" "e f")

# Expansion behavior:
echo ${arr[@]}        # a b c d e f (6 words, word-split)
echo ${arr[*]}        # a b c d e f (6 words)
echo "${arr[@]}"      # "a b" "c d" "e f" (3 words, correct)
echo "${arr[*]}"      # "a b c d e f" (1 word, joined)

# With custom IFS:
old_ifs="$IFS"; IFS=:
echo "${arr[*]}"      # "a b:c d:e f" (joined with :)
IFS="$old_ifs"
```

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Declaring arrays
- [var-arrays-cautious](./var-arrays-cautious.md) - Arrays vs strings
