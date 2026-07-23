# port-coproc-portable

> Document Bash-specific features when used

## Why It Matters

Bash offers many features absent from POSIX sh: arrays, `[[ ]]`, coprocesses, namerefs, process substitution, and `{1..10}` brace expansion. When using these, add a comment noting the dependency so future maintainers know the script requires Bash. This is especially important in environments like Docker containers where Bash may not be the default.

## Bad

```bash
#!/bin/sh
# Uses bashisms without documentation

# Maintainer doesn't know why this fails on Alpine
items=($(ls))           # Arrays — bashism
for f in "${items[@]}"; do
    [[ -f "$f" ]] && process "$f"  # [[ ]] — bashism
done < <(find . -type f)  # Process substitution — bashism
```

## Good

```bash
#!/usr/bin/env bash
# Requires: Bash 4.0+ (uses arrays, [[ ]], process substitution)

# Bash-specific: read files into array (no POSIX equivalent)
shopt -s nullglob
declare -a files=(*.txt)

# Bash-specific: [[ ]] for regex matching
for f in "${files[@]}"; do
    if [[ "$f" =~ ^[0-9]{4}-.+\.txt$ ]]; then
        process "$f"
    fi
done

# Bash-specific: process substitution avoids subshell
while IFS= read -r line; do
    count=$((count + 1))
done < <(generate_data)
```

## Documenting Bash Features

```bash
# Template comment for bash-specific blocks
# Requires: Bash 4.3+ (namerefs: declare -n)
process_config() {
    local -n config_ref="$1"
    for key in "${!config_ref[@]}"; do
        echo "${key}=${config_ref[$key]}"
    done
}

# Requires: Bash 4.0+ (associative arrays)
declare -A cache

# Requires: Bash 5.0+ (EPOCHSECONDS)
echo "Current time: ${EPOCHSECONDS}"

# Requires: Bash 5.1+ (SRANDOM)
echo "Random: ${SRANDOM}"
```

## Feature → Minimum Bash Version

| Feature | Minimum Bash |
|---------|-------------|
| Associative arrays | 4.0 |
| `declare -n` (namerefs) | 4.3 |
| `coproc` | 4.0 |
| `;&` / `;;&` in case | 4.0 |
| `EPOCHSECONDS` | 5.0 |
| `SRANDOM` | 5.1 |
| `shopt -s inherit_errexit` | 4.4 |
| `wait -n` | 4.3 |

## See Also

- [port-avoid-bashisms](./port-avoid-bashisms.md) - What to avoid in POSIX
- [port-shebang-choice](./port-shebang-choice.md) - Choosing the right shebang
