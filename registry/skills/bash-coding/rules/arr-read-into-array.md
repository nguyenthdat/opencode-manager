# arr-read-into-array

> Use `readarray`/`mapfile` for reading lines into array

## Why It Matters

`readarray` (also called `mapfile`) reads lines from stdin or a file into an indexed array in a single operation, handling newline-separated data efficiently. It's far cleaner than manual `while read` loops for populating arrays, handles blank lines correctly, and supports options for stripping trailing newlines (`-t`) and limiting the number of lines read.

## Bad

```bash
# Manual loop to read file into array — verbose
declare -a lines=()
while IFS= read -r line; do
    lines+=("$line")
done < "$file"

# Command output into array — fragile
declare -a files=($(ls))    # Word splitting, globbing!
```

## Good

```bash
# Read all lines into array (Bash 4.0+)
readarray -t lines < "$file"

# Strip trailing newlines (-t), including blank lines
readarray -t lines < "$file"

# Read command output with process substitution
readarray -t files < <(find . -name "*.txt" -print0 | xargs -0 -n1)

# Read first N lines only
readarray -t -n 5 first_five < "$file"

# Skip first N lines
readarray -t -s 2 remaining < "$file"   # Skip first 2 lines

# Read from heredoc
readarray -t items <<'EOF'
apple
banana
cherry
EOF

# With null delimiter (for find -print0)
readarray -t -d '' files < <(find . -name "*.txt" -print0)
```

## readarray/mapfile Options

| Option | Description |
|--------|-------------|
| `-t` | Strip trailing newline from each line |
| `-n N` | Read at most N lines |
| `-s N` | Skip first N lines |
| `-O N` | Start writing at array index N |
| `-d CHAR` | Use CHAR as line delimiter (Bash 4.4+) |
| `-C CMD` | Evaluate CMD every N lines (`-c N` required) |

## See Also

- [arr-declare-arrays](./arr-declare-arrays.md) - Declaring arrays
- [io-read-while-pipe](./io-read-while-pipe.md) - The manual read-while pattern
