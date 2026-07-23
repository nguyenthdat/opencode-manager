# anti-pipe-while-subshell

> Don't modify variables in pipe `while` loops (subshell issue)

## Why It Matters

`cmd | while read` runs the `while` loop in a subshell. Any variable modifications inside the loop are lost when the pipe exits. This is the most common "works in terminal but not in script" bug. Use process substitution `done < <(cmd)` to keep the loop in the current shell and preserve variable state.

## Bad

```bash
count=0
found=()
cat data.txt | while IFS= read -r line; do
    ((count++))               # Lost!
    [[ "$line" == *error* ]] && found+=("$line")  # Lost!
done
echo "Found: $count"           # Always 0
echo "${#found[@]}"            # Always 0
```

## Good

```bash
count=0
found=()
while IFS= read -r line; do
    ((count++))
    [[ "$line" == *error* ]] && found+=("$line")
done < data.txt   # Direct redirection — no subshell
echo "Found: $count"
echo "${#found[@]}"

# Or: process substitution
while IFS= read -r line; do
    ((count++))
done < <(some_command)
echo "$count"  # Correct!
```

## See Also

- [io-read-while-pipe](./io-read-while-pipe.md) - The read-while pattern
- [io-process-substitution](./io-process-substitution.md) - Process substitution
