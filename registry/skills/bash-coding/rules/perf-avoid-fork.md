# perf-avoid-fork

> Use builtins (`[[ ]]`, `${var##}`, `printf`) to avoid subshell forks

## Why It Matters

Every external command invocation (`grep`, `sed`, `awk`, `cut`) spawns a new process — a `fork()` + `exec()` that is expensive. In loops, this adds up quickly. Bash builtins (`[[ ]]`, parameter expansion, `printf`, `read`) execute in-process. Using builtins over external tools can make scripts 10-100x faster, especially in hot loops.

## Bad

```bash
# Forking to grep, sed, awk, cut in a loop
for file in *.txt; do
    if echo "$file" | grep -q "important"; then
        basename="$(echo "$file" | sed 's/\.txt$//')"
        extension="$(echo "$file" | rev | cut -d. -f1 | rev)"
        echo "Processing: $basename"
    fi
done
```

## Good

```bash
# Bash builtins — no forks
for file in *.txt; do
    if [[ "$file" == *important* ]]; then
        basename="${file%.txt}"
        extension="${file##*.}"
        echo "Processing: ${basename}"
    fi
done
```

## Builtin vs External Quick Reference

| Task | External (fork) | Builtin (no fork) |
|------|----------------|-------------------|
| Pattern match | `grep -q "$pat" <<< "$str"` | `[[ "$str" == *$pat* ]]` |
| Remove suffix | `sed 's/\.txt$//' <<< "$f"` | `"${f%.txt}"` |
| Remove prefix | `sed 's|^/usr/||' <<< "$f"` | `"${f#/usr/}"` |
| Replace all | `sed 's/a/b/g' <<< "$s"` | `"${s//a/b}"` |
| String length | `wc -c <<< "$s"` | `"${#s}"` |
| Uppercase | `tr 'a-z' 'A-Z' <<< "$s"` | `"${s^^}"` (Bash 4+) |
| Substring | `cut -c1-5 <<< "$s"` | `"${s:0:5}"` |

## See Also

- [perf-avoid-cat-useless](./perf-avoid-cat-useless.md) - Useless use of cat
- [perf-inline-grep](./perf-inline-grep.md) - Pattern matching alternatives
