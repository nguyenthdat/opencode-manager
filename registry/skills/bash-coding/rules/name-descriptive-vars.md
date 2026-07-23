# name-descriptive-vars

> Use descriptive variable names; avoid `a`, `b`, `c`, `x`

## Why It Matters

Shell scripts are read more often than written, and short variable names like `x`, `f`, or `t` force readers to trace through code to understand their purpose. Descriptive names like `input_file`, `retry_count`, and `output_dir` make the code self-documenting and reduce the mental burden of understanding data flow. Save single-letter names for loop indices only.

## Bad

```bash
# Cryptic names — what do they mean?
f="$1"          # file? flag? function?
d="$2"          # directory? date? database?
x=""            # ????
t=""            # temp? target? time?

# Single letters throughout
for i in $(ls); do
    c=$(wc -l < "$i")
    if [ "$c" -gt 0 ]; then
        mv "$i" "$o/$i"
    fi
done
```

## Good

```bash
# Descriptive names — self-documenting
input_file="$1"
output_directory="$2"
error_count=0
temp_dir="$(mktemp -d)"

for filename in *.txt; do
    line_count="$(wc -l < "$filename")"
    if ((line_count > 0)); then
        mv "$filename" "${output_directory}/${filename}"
    fi
done
```

## Naming Guidelines

```bash
# Array names: plural
declare -a log_files=()
declare -a active_users=()

# Loop indices: single letter (i, j, k) is acceptable
for ((i = 0; i < n; i++)); do
    for ((j = 0; j < m; j++)); do
        process "$i" "$j"
    done
done

# File paths: *_file, *_dir
config_file="/etc/app/config.yaml"
cache_dir="${HOME}/.cache/app"
log_dir="/var/log/app"

# Counts: *_count
error_count=0
line_count=0
processed_count=0

# Status flags: descriptive
declare download_successful=0
declare validation_passed=0
```

## See Also

- [name-variables-lowercase-local](./name-variables-lowercase-local.md) - Local variable naming
- [name-temp-vars-prefix](./name-temp-vars-prefix.md) - Prefixing temp variables
