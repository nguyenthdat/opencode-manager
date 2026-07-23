# perf-inline-grep

> Use Bash pattern matching over `grep` when possible

## Why It Matters

`grep` is an external process — each invocation forks a new process. For simple pattern matching (substring check, glob match), Bash builtins like `[[ "$var" == *pattern* ]]` and `[[ "$var" =~ ^[0-9]+$ ]]` run entirely in-process. While `grep` wins for large files, for matching against variables or short strings, builtins are orders of magnitude faster.

## Bad

```bash
# grep on a simple variable — fork for no reason
if echo "$filename" | grep -q "\.txt$"; then
    echo "Text file"
fi

if echo "$input" | grep -qE '^[0-9]+$'; then
    echo "Numeric"
fi

# grep in a loop
for item in "${items[@]}"; do
    if echo "$item" | grep -q "error"; then
        process_error "$item"
    fi
done
```

## Good

```bash
# Bash pattern matching — no fork
if [[ "$filename" == *.txt ]]; then
    echo "Text file"
fi

# Bash regex — no fork
if [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "Numeric"
fi

# Loop with builtins
for item in "${items[@]}"; do
    if [[ "$item" == *error* ]]; then
        process_error "$item"
    fi
done
```

## When grep IS Better

```bash
# 1. Searching large files (grep is optimized for this)
grep "pattern" /var/log/syslog

# 2. Complex regex (easier to read/maintain than [[ =~ ]])
grep -E '^(error|warn): ([0-9]+) .+' <<< "$line"

# 3. grep flags: -c (count), -v (invert), -o (only-matching), -A/-B/-C
grep -c "ERROR" log.txt

# 4. Case-insensitive matching ([[ =~ ]] doesn't support /i)
grep -iq "error" <<< "$msg"
```

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Avoiding external processes
- [port-posix-test](./port-posix-test.md) - [[ ]] vs [ ]
