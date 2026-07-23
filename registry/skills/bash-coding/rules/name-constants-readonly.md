# name-constants-readonly

> `readonly VARIABLE_NAME` for constants

## Why It Matters

Shell has no compile-time constant mechanism. `readonly` or `declare -r` provides runtime enforcement, preventing accidental reassignment and signaling to readers that the value is a constant. Coupled with UPPER_CASE naming, readonly variables create a clear "don't modify" contract within the script.

## Bad

```bash
#!/usr/bin/env bash

# Magic numbers with no protection
port=8080
max_retries=3
config_dir="${HOME}/.config/app"

# Accidentally overwritten later
process_config() {
    port=9090   # Oops, changes the "constant"
}

# No way to know these shouldn't change
timeout=30
retries=5
```

## Good

```bash
#!/usr/bin/env bash

# Bash: declare -r for type clarity
declare -r DEFAULT_PORT=8080
declare -r MAX_RETRIES=3
declare -r -i MAX_TIMEOUT=30    # Integer attribute
declare -r CONFIG_DIR="${HOME}/.config/app"

# POSIX-compatible: readonly keyword
readonly DEFAULT_PORT=8080
readonly MAX_RETRIES=3
readonly CONFIG_DIR="${HOME}/.config/app"

# With array (Bash only)
declare -r -a VALID_FORMATS=("json" "yaml" "toml")
declare -r -A EXIT_CODES=(
    [SUCCESS]=0
    [INVALID_ARGS]=2
    [NOT_FOUND]=3
)

# Reassignment fails with clear error
# DEFAULT_PORT=9090  # bash: DEFAULT_PORT: readonly variable
```

## See Also

- [var-readonly-constants](./var-readonly-constants.md) - Using readonly for constants
- [name-variables-uppercase-env](./name-variables-uppercase-env.md) - UPPER_CASE naming
