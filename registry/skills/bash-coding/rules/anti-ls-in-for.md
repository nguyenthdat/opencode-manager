# anti-ls-in-for

> Never use `for f in $(ls)`; use globs: `for f in *`

## Why It Matters

`$(ls)` splits on whitespace, mangling filenames with spaces, tabs, or newlines. It also expands `*` in the output. `*.txt` glob expands directly to properly delimited filenames without any external process or word splitting. ShellCheck rule SC2045 flags this. There is never a reason to use `ls` in a `for` loop.

## Bad

```bash
# WRONG: word splitting breaks filenames with spaces
for f in $(ls *.txt); do
    process "$f"   # "my file.txt" splits into "my" and "file.txt"
done

# WRONG: ls output not designed for parsing
for f in $(ls -1); do
    echo "$f"
done
```

## Good

```bash
# Correct: glob expansion — handles all filenames
shopt -s nullglob   # Handle empty matches
for f in *.txt; do
    process "$f"     # Works with spaces, special chars, everything
done

# Recursive with globstar (Bash 4.0+)
shopt -s globstar
for f in **/*.txt; do
    process "$f"
done

# With find for complex searches
while IFS= read -r -d '' f; do
    process "$f"
done < <(find . -name "*.txt" -print0)
```

## See Also

- [perf-glob-over-find](./perf-glob-over-find.md) - Globs vs find
- [var-arrays-cautious](./var-arrays-cautious.md) - Arrays for file lists
