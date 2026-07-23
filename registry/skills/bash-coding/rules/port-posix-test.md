# port-posix-test

> Use `[ ]` instead of `[[ ]]` when portability matters

## Why It Matters

`[[ ]]` is a Bash (and ksh/zsh) extension that provides enhanced test capabilities: regex matching (`=~`), pattern matching (`==` with globs), and safe unquoted variable handling. `[ ]` (also known as `test`) is POSIX-mandated and works everywhere. Choose `[[ ]]` for Bash scripts (safer, more powerful), `[ ]` for POSIX scripts that must run on any shell.

## Bad

```bash
#!/bin/sh
# Using [[ ]] in a POSIX script — breaks on dash
if [[ "$name" == "admin" ]]; then
    echo "Admin user"
fi

if [[ -z "$var" || ! -f "$file" ]]; then
    echo "Missing"
fi
```

## Good

```bash
#!/bin/sh
# POSIX test with [ ]
if [ "$name" = "admin" ]; then
    echo "Admin user"
fi

# Compound conditions with -a/-o or separate test commands
if [ -z "$var" ] || [ ! -f "$file" ]; then
    echo "Missing"
fi

# Alternatively, use && / ||
[ -z "$var" ] && { echo "Empty"; exit 1; }
```

## When to Use [[ ]] (Bash Only)

```bash
#!/usr/bin/env bash
# [[ ]] is safer — no word splitting, no globbing, regex support

# Regex matching (no POSIX equivalent without grep)
if [[ "$input" =~ ^[0-9]+$ ]]; then
    echo "Numeric"
fi

# Pattern matching with globs
if [[ "$filename" == *.txt ]]; then
    echo "Text file"
fi

# Safe with unquoted variables (but still quote for clarity)
if [[ -n $var ]]; then   # No word splitting in [[ ]]
    echo "Set"
fi
```

## Test Operator Comparison

| Test | `[ ]` (POSIX) | `[[ ]]` (Bash) |
|------|--------------|-----------------|
| String equality | `= ` | `== ` or `=` |
| Pattern match | No | `== *.txt` |
| Regex match | No | `=~ ^[0-9]+$` |
| AND | `-a` or `&&` between `[ ]` | `&&` inside `[[ ]]` |
| OR | `-o` or `\|\|` between `[ ]` | `\|\|` inside `[[ ]]` |
| Variable quoting | Required | Recommended |
| Word splitting | Yes | No |

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - Bash-isms to avoid in POSIX
- [anti-single-brackets-bash](./anti-single-brackets-bash.md) - Using [ ] in Bash scripts
