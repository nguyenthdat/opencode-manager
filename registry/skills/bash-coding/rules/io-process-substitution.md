# io-process-substitution

> Use `<(cmd)` and `>(cmd)` for piping without subshells

## Why It Matters

Standard pipes (`cmd | while read`) run the `while` loop in a subshell, meaning variable modifications inside the loop are lost. Process substitution (`<(cmd)`) creates a named pipe (or `/dev/fd` reference), allowing the loop to run in the current shell. This preserves variable state and is essential for counters, accumulators, and flags modified inside read loops.

## Bad

```bash
# Pipe into while creates a subshell — variables lost
count=0
found=()
cat "$file" | while IFS= read -r line; do
    ((count++))
    [[ "$line" == *error* ]] && found+=("$line")
done
echo "Lines: $count"      # Always 0
echo "Found: ${#found[@]}"  # Always 0
```

## Good

```bash
# Process substitution — no subshell
count=0
found=()
while IFS= read -r line; do
    ((count++))
    [[ "$line" == *error* ]] && found+=("$line")
done < <(cat "$file")
echo "Lines: $count"      # Correct
echo "Found: ${#found[@]}"  # Correct

# Also use <() for diffing command output
diff <(ls dir1) <(ls dir2)

# Compare sorted outputs
comm <(sort file1) <(sort file2)

# Feed multiple streams to a command
paste <(cut -f1 file1) <(cut -f2 file2)

# Output process substitution (rare)
exec 3> >(logger -t myscript)
echo "Log message" >&3
```

## How It Works

```bash
# <(cmd) creates a named pipe:
echo <(date)  # /dev/fd/63 (a file descriptor referencing the pipe)

# Equivalent to:
mkfifo /tmp/fifo
cmd > /tmp/fifo &
read data < /tmp/fifo
# But without the temp file management
```

## See Also

- [io-read-while-pipe](./io-read-while-pipe.md) - The read-while pattern
- [anti-pipe-while-subshell](./anti-pipe-while-subshell.md) - The subshell anti-pattern
- [perf-avoid-subshell-loop](./perf-avoid-subshell-loop.md) - Performance angle
