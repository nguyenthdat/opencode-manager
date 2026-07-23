# io-read-r-preserve

> Use `read -r` to preserve backslashes

## Why It Matters

Without `-r`, `read` interprets backslash escapes: `\n` becomes newline, `\t` becomes tab, and `\` at end of line continues input on the next line. This silently corrupts data containing literal backslashes (file paths on Windows, regex patterns, JSON strings, or any text with `\`). Always use `read -r` unless you specifically need escape processing.

## Bad

```bash
# read without -r corrupts backslashes
while read line; do
    echo "$line"
done <<'EOF'
C:\Users\name\Documents
pattern: \d+\.\d+
\t is a tab
EOF
# Output:
# C:UsersnameDocuments   (backslashes stripped!)
# pattern: d+.d+         (escapes lost)
#       is a tab          (\t became actual tab)

# End-of-line continuation
echo "line1\nline2\ continues" | while read line; do
    echo "[$line]"
done
# [line1] [line2 continues] — line2 was joined
```

## Good

```bash
# read -r preserves backslashes
while IFS= read -r line; do
    echo "$line"
done <<'EOF'
C:\Users\name\Documents
pattern: \d+\.\d+
\t is a tab
EOF
# Output is exact:
# C:\Users\name\Documents
# pattern: \d+\.\d+
# \t is a tab

# Complete safe pattern
while IFS= read -r line || [[ -n "$line" ]]; do
    process "$line"
done < "$file"
```

## Why -r Is Default-On in Other Languages

```bash
# Python: lines preserve backslashes by default
# Perl: chomp doesn't mangle backslashes
# Bash: read does — always add -r
```

## See Also

- [io-read-while-pipe](./io-read-while-pipe.md) - The complete read while pattern
- [port-printf-over-echo](./port-printf-over-echo.md) - printf for portable output
