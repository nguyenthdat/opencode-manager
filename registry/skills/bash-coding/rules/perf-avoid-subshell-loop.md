# perf-avoid-subshell-loop

> Don't pipe into `while`; use process substitution

## Why It Matters

`cmd | while read` runs the `while` loop in a subshell. Variables modified inside the loop are lost when the pipeline ends. This is the #1 "my counter is always zero" bug. Process substitution `done < <(cmd)` keeps the loop in the current shell, preserving variable modifications. It's also slightly faster by avoiding a subshell fork.

## Bad

```bash
# Pipe into while — subshell, variables lost
count=0
total_size=0
find . -name "*.txt" | while IFS= read -r file; do
    size=$(stat -f%z "$file")
    ((count++))
    ((total_size += size))
done
echo "Files: $count, Size: $total_size"    # Always 0, 0!
```

## Good

```bash
# Process substitution — variables persist
count=0
total_size=0
while IFS= read -r file; do
    size=$(stat -f%z "$file")
    ((count++))
    ((total_size += size))
done < <(find . -name "*.txt")
echo "Files: $count, Size: $total_size"    # Correct!

# Alternative: use a file
find . -name "*.txt" > /tmp/files.txt
while IFS= read -r file; do
    process "$file"
done < /tmp/files.txt

# Alternative: collect output in the subshell
count=$(find . -name "*.txt" | wc -l)
```

## The Subshell Problem Explained

```bash
# Every pipe component runs in its own subshell:
cmd1 | cmd2 | cmd3
# cmd1, cmd2, cmd3 are all subshells

# In 'cmd | while read', the while loop IS cmd2 — a subshell
# Variables set there don't propagate back to the parent

# Process substitution creates a named pipe / file descriptor:
while read; do
    var=42   # This is the CURRENT shell, not a subshell
done < <(cmd)
echo "$var"  # 42 — works!
```

## See Also

- [io-read-while-pipe](./io-read-while-pipe.md) - The read-while pattern
- [io-process-substitution](./io-process-substitution.md) - Process substitution
- [anti-pipe-while-subshell](./anti-pipe-while-subshell.md) - The anti-pattern
