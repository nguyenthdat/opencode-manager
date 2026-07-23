# io-null-dev-null

> Use `/dev/null` explicitly; avoid writing to stdout

## Why It Matters

`/dev/null` is the Unix bit bucket — data written to it is discarded, and reads return EOF. It's essential for suppressing unwanted output without breaking pipelines. Using it correctly (vs silencing everything with `&>`) keeps the right output visible while discarding only what you don't need.

## Bad

```bash
# Suppressing ALL output — hides errors too
command &> /dev/null       # Errors lost!

# Redirecting stderr to stdout, then to /dev/null — confusing
command 2>&1 > /dev/null   # stderr still goes to terminal (wrong order!)

# Not checking if /dev/null is writable (it always is)
[ -w /dev/null ] || exit 1  # Pointless check

# Writing temporary trash files instead of /dev/null
long_output > trash.tmp && rm trash.tmp
```

## Good

```bash
# Suppress only stdout, keep stderr visible
command > /dev/null

# Suppress only stderr
command 2> /dev/null

# Suppress both (intentional)
command &> /dev/null

# Read from /dev/null for empty input
command < /dev/null

# Empty file content
: > file.txt  # Truncates file; faster than cp /dev/null file.txt

# Test command without output
if command > /dev/null 2>&1; then
    echo "Command succeeded"
fi

# Command that requires a file but you want empty input
diff <(cat /dev/null) <(sort file.txt)
```

## See Also

- [io-stderr-redirect](./io-stderr-redirect.md) - Stderr redirection
- [err-avoid-ignore-errors](./err-avoid-ignore-errors.md) - When to not suppress errors
