# io-read-while-pipe

> Use `while IFS= read -r line` pattern correctly

## Why It Matters

The `while read` loop is the idiomatic way to process input line-by-line in shell scripts. Using the correct pattern — `IFS=` (preserve leading/trailing whitespace), `-r` (preserve backslashes), and proper pipe/subshell awareness — prevents subtle data corruption and variable scoping bugs. Getting this wrong silently mangles input.

## Bad

```bash
# Missing -r: backslashes are interpreted
while read line; do
    echo "$line"        # "line\n" becomes "linen" — backslash consumed
done < "$file"

# Missing IFS=: leading/trailing whitespace stripped
echo "  indented text  " | while read line; do
    echo "[$line]"      # [indented text] — spaces lost!
done

# Pipe into while: variables lost outside loop (subshell!)
count=0
cat "$file" | while read -r line; do
    ((count++))
done
echo "$count"           # 0 — subshell variable changes are lost!
```

## Good

```bash
# Complete idiomatic pattern
while IFS= read -r line; do
    process "$line"
done < "$file"

# Preserve leading/trailing whitespace, backslashes literal
while IFS= read -r line || [[ -n "$line" ]]; do
    # || [[ -n "$line" ]] handles files without trailing newline
    echo "[$line]"
done < "$file"

# Process substitution to avoid subshell
count=0
while IFS= read -r line; do
    ((count++))
done < <(some_command)
echo "$count"  # Correct — variables persist!

# Read with delimiter (null byte for find -print0)
while IFS= read -r -d '' file; do
    process "$file"
done < <(find . -name "*.txt" -print0)
```

## Common Errors Fixed

```bash
# Wrong: subshell loses variable
line_count=0
find . -name "*.txt" | while IFS= read -r f; do
    ((line_count++))
done
echo "$line_count"  # Always 0

# Right: process substitution preserves context
line_count=0
while IFS= read -r f; do
    ((line_count++))
done < <(find . -name "*.txt")
echo "$line_count"  # Correct
```

## See Also

- [io-process-substitution](./io-process-substitution.md) - Process substitution for subshell avoidance
- [anti-pipe-while-subshell](./anti-pipe-while-subshell.md) - The subshell anti-pattern
