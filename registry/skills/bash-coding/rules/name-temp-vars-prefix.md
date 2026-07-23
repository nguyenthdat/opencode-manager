# name-temp-vars-prefix

> Prefix temp variables with `_` to mark as internal

## Why It Matters

Temporary and internal-use variables (loop accumulators, saved IFS values, scratch buffers) should be clearly distinguished from meaningful variables. The `_` prefix convention signals "this is an implementation detail, don't depend on it." This is especially important in libraries where callers might otherwise rely on internal variables.

## Bad

```bash
save_config_state() {
    # Internal variables look like public API
    old_ifs="$IFS"
    file_list="$(ls)"
    cached_result=""
    # Caller might depend on these accidentally
}

# No way to know these are internal
temp="$(mktemp)"
buffer=""
count=0
```

## Good

```bash
save_config_state() {
    # _ prefix = internal/private
    local _old_ifs="$IFS"
    IFS=$'\n'
    local _file_list=()
    _file_list=($(ls))
    local _result=""
    IFS="$_old_ifs"
    echo "$_result"
}

# Temporary variables clearly marked
declare _temp_file="$(mktemp)"
declare _buffer=""
declare _scratch=""

# Loop variable — single letter or _ prefix
for _ in $(seq 1 10); do   # $_ is "don't care"
    retry_operation
done

# Accumulator that's clearly internal
declare _running_total=0
while IFS= read -r _line; do
    ((_running_total++))
done < "$file"
```

## Prefix Conventions

| Prefix | Meaning |
|--------|---------|
| `_` | Internal/private implementation detail |
| `__` | Very internal, "don't even look" |
| No prefix | Public/semantic variable |

## See Also

- [name-variables-lowercase-local](./name-variables-lowercase-local.md) - Local variable naming
- [name-descriptive-vars](./name-descriptive-vars.md) - Descriptive variable names
