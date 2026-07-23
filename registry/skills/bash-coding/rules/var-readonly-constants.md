# var-readonly-constants

> Use `readonly` or `declare -r` for constants

## Why It Matters

Shell scripts lack compile-time constants. `readonly` and `declare -r` provide runtime enforcement, preventing accidental reassignment of configuration values and magic numbers. This makes scripts more robust and self-documenting by clearly signaling which values are not meant to change.

## Bad

```bash
# Magic numbers with no protection
port=8080

# Accidentally overwritten later
process() {
    port=9090   # Oops, changes the global
}

# No indication that this shouldn't change
max_retries=3
max_retries=5   # Accidental overwrite
```

## Good

```bash
# Bash: declare -r for read-only
declare -r DEFAULT_PORT=8080
declare -r MAX_RETRIES=3
declare -r CONFIG_DIR="${HOME}/.config/myapp"

# POSIX-compatible
readonly DEFAULT_PORT=8080
readonly MAX_RETRIES=3

# Constants that are arrays (Bash only)
declare -r -a VALID_ACTIONS=("start" "stop" "restart")

# Associative array constant
declare -r -A HTTP_CODES=(
    [OK]=200
    [NOT_FOUND]=404
    [SERVER_ERROR]=500
)

# Config from environment with readonly default
readonly APP_ENV="${APP_ENV:-production}"
readonly LOG_LEVEL="${LOG_LEVEL:-info}"

# Attempting to reassign will fail:
# DEFAULT_PORT=9090  # bash: DEFAULT_PORT: readonly variable
```

## See Also

- [name-constants-readonly](./name-constants-readonly.md) - Naming conventions for constants
- [var-uppercase-env](./var-uppercase-env.md) - Uppercase for environment variables
