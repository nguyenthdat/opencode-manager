# port-no-local-posix

> Don't use `local` in POSIX sh (Bash-ism)

## Why It Matters

`local` is not part of the POSIX shell specification. While supported in Bash, dash, and some implementations of ash, it's absent from ksh93 and may cause syntax errors in strict POSIX shells. When writing POSIX-compatible scripts, use naming conventions (prefix with function name) or subshells to avoid variable leakage instead of relying on `local`.

## Bad

```bash
#!/bin/sh
# local is NOT POSIX — fails on some shells

process_file() {
    local filename="$1"       # Syntax error on ksh93!
    local count=0
    local line
    while IFS= read -r line; do
        count=$((count + 1))
    done < "$filename"
    echo "$count"
}
```

## Good

```bash
#!/bin/sh
# POSIX-compatible: prefix with function name

process_file() {
    _process_file_filename="$1"
    _process_file_count=0
    _process_file_line=""
    while IFS= read -r _process_file_line; do
        _process_file_count=$((_process_file_count + 1))
    done < "$_process_file_filename"
    echo "$_process_file_count"
}

# Or use a subshell to contain all variables
process_file() {
    (
        filename="$1"
        count=0
        while IFS= read -r line; do
            count=$((count + 1))
        done < "$filename"
        echo "$count"
    )
    # Variables don't leak outside the subshell
}
```

## Recommendations

```bash
# 1. Bash scripts: use local always
#!/usr/bin/env bash
my_func() {
    local x="$1"
}

# 2. POSIX scripts: use naming convention or subshells
#!/bin/sh
my_func() {
    _my_func_x="$1"          # Prefix with function name
}

# 3. Library code (sourced into unknown environments):
# Use subshell approach for maximum compatibility
```

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - Bash-isms in POSIX scripts
- [var-local-in-functions](./var-local-in-functions.md) - Using local in Bash
