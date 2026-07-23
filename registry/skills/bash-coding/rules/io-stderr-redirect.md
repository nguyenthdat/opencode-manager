# io-stderr-redirect

> Redirect stderr explicitly: `2>/dev/null` or `2>&1`

## Why It Matters

Unix processes have three standard streams: stdin (0), stdout (1), and stderr (2). Mixing stdout and stderr silently corrupts output parsing or masks errors. Explicit stderr redirection keeps program output clean and ensures errors are visible (or intentionally suppressed with good reason). Every script should control where its output goes.

## Bad

```bash
# stdout and stderr mixed — parsers choke on error messages
output="$(curl "$url")"        # stderr pollutes $output

# Errors silently lost
command > /dev/null             # Only redirects stdout; stderr still prints

# Ambiguous — what's being redirected?
command 2>&1 > file             # Wrong order! stderr goes to original stdout, then stdout goes to file
```

## Good

```bash
# Capture stdout only, let stderr through
output="$(curl "$url" 2>/dev/null)"

# Capture both stdout and stderr
output="$(command 2>&1)"

# Log stderr to file
command 2>> error.log

# Send stdout and stderr to different places
command > output.txt 2> errors.txt

# Combined output to file with append
command >> combined.log 2>&1

# Write to stderr explicitly
echo "Error message" >&2

# Proper order: redirect stdout first, then stderr to stdout
command > file 2>&1           # Both go to file
command 2>&1 > file           # BUG: stderr goes to terminal, not file

# Suppress all output
command &>/dev/null            # Bash shortcut for >/dev/null 2>&1
```

## Redirection Quick Reference

| Syntax | Effect |
|--------|--------|
| `cmd 2>/dev/null` | Discard stderr |
| `cmd 2>&1` | Redirect stderr to stdout |
| `cmd >file 2>&1` | Both to file (correct order) |
| `cmd &>file` | Both to file (Bash) |
| `cmd >>file 2>>file` | Append both to file |
| `cmd 2>&1 \| next` | Pipe stdout and stderr |
| `cmd \|& next` | Pipe both (Bash) |

## See Also

- [debug-no-echo-debug](./debug-no-echo-debug.md) - Using stderr for debug output
- [io-file-descriptor-management](./io-file-descriptor-management.md) - Custom FDs
