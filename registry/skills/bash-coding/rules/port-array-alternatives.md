# port-array-alternatives

> Use IFS-delimited strings when arrays aren't available

## Why It Matters

Bash arrays (`declare -a`, `declare -A`) are not available in POSIX sh (dash, ash, BusyBox). When writing portable scripts, you need alternatives: IFS-delimited strings with `set --` for positional parameters, newline-separated strings, or structured files. Understanding these patterns is essential for cross-platform scripting.

## Bad

```bash
#!/bin/sh
# Arrays are not POSIX — fails on dash/ash

items=(a b c)                  # Syntax error
echo "${items[0]}"             # Syntax error
items+=("d")                   # Syntax error

declare -A map                 # Syntax error
map[key]="value"               # Syntax error
```

## Good

```bash
#!/bin/sh
# Positional parameters as pseudo-array
set -- a b c "my file.txt"
# $1 = a, $2 = b, $3 = c, $4 = my file.txt

for item in "$@"; do
    echo "$item"
done

# Build a list
set --
for file in *.txt; do
    set -- "$@" "$file"
done

# IFS-delimited string (colon-separated)
paths="/usr/bin:/usr/local/bin:/opt/bin"
old_ifs="$IFS"
IFS=:
for path in $paths; do
    echo "$path"
done
IFS="$old_ifs"

# Newline-separated (for complex data)
list=""
for file in *.txt; do
    list="${list}${file}\n"
done
printf '%b' "$list" | while IFS= read -r file; do
    process "$file"
done

# Simulated associative array with plain variables
# key="host" => var_host
set_config() { eval "config_$1=\$2"; }
get_config() { eval "echo \$config_$1"; }
set_config host "localhost"
get_config host  # "localhost"
```

## When to Use Arrays (Go Bash)

```bash
# If you need complex data structures, use Bash:
# 1. Lists of files (preserving spaces/newlines)
# 2. Associative mappings
# 3. Multi-dimensional data
# 4. Anything that would require eval with POSIX

#!/usr/bin/env bash
declare -a files=("file 1.txt" "file 2.txt")
for f in "${files[@]}"; do process "$f"; done
```

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - POSIX compatibility
- [arr-declare-arrays](./arr-declare-arrays.md) - Using Bash arrays
