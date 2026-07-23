# io-here-string

> Use `<<<` for simple string input

## Why It Matters

Here-strings (`<<< "string"`) provide a concise way to pass a single string as stdin to a command, avoiding the overhead of `echo | cmd` (an extra pipe and fork). They're ideal for feeding variables to commands like `read`, `grep`, `bc`, or `tr`. Here-strings are a Bash extension (not POSIX) but are widely supported in modern shells.

## Bad

```bash
# Echo pipe — extra process, extra pipe
echo "$data" | grep "pattern"
echo "$expression" | bc
echo "hello world" | tr 'a-z' 'A-Z'

# Heredoc overkill for a single line
read -r name <<EOF
$USER
EOF
```

## Good

```bash
# Here-string: clean, no extra process
grep "pattern" <<< "$data"
bc <<< "$expression"
tr 'a-z' 'A-Z' <<< "hello world"

# Read from a variable
read -r name <<< "$USER"

# Combine with command substitution
if grep -q "$pattern" <<< "$(some_command)"; then
    echo "Found"
fi

# Multi-line variable (yes, it works)
read -r first_line <<< "$multi_line_var"  # Only reads first line

# With command-line arguments
md5sum <<< "check this string"

# Heredoc still better for multi-line
cat <<'EOF'
Multiple
lines
here
EOF
```

## Performance Note

```bash
# echo | cmd: fork + pipe
# cmd <<< "str": no fork, no pipe — ~30% faster

# For simple string passing, here-strings win
for i in {1..1000}; do
    bc <<< "scale=4; $i / 3"
done
```

## See Also

- [io-heredoc-quote](./io-heredoc-quote.md) - Heredocs for multi-line
- [perf-here-string-speed](./perf-here-string-speed.md) - Performance comparison
