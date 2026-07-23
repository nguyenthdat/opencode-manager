# name-globals-caps

> UPPER_CASE for globals in scripts

## Why It Matters

Global variables — especially mutable ones — should be visually distinct from local variables to prevent accidental modification and make scope clear at a glance. UPPER_CASE for globals follows the same convention as environment variables and constants, creating a consistent visual language for variable scope.

## Bad

```bash
#!/usr/bin/env bash

# Global variables look exactly like locals
status="running"
total_count=0
output_dir="/tmp/build"

process() {
    status="processing"    # Modifies global — not obvious from name
    total_count=5          # Modifies global — not obvious from name
}

# Reader can't tell global from local
database_host="localhost"  # Is this local or global?
```

## Good

```bash
#!/usr/bin/env bash

# Globals in UPPER_CASE
declare STATUS="running"
declare -i TOTAL_COUNT=0
declare OUTPUT_DIR="/tmp/build"

# Constants (also UPPER_CASE, but readonly)
readonly MAX_RETRIES=3
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

process() {
    # Locals in lowercase — clearly different from globals
    local status="processing"
    local file_count=5

    # Modify global explicitly
    STATUS="completed"
    ((TOTAL_COUNT += file_count))
}
```

## Global Variable Best Practices

```bash
# 1. Minimize globals — pass values as arguments/return values
# 2. Document every global at the top of the script
# 3. Use UPPER_CASE to make scope obvious
# 4. Prefer readonly for configuration-like globals

# Global variable documentation block at top of script:
# Globals:
#   CONFIG_FILE     - Path to configuration file (readonly)
#   PROCESSED_COUNT - Number of files processed (mutable)
#   ERRORS_FOUND    - Whether any errors occurred (mutable, 0/1)
```

## See Also

- [name-variables-uppercase-env](./name-variables-uppercase-env.md) - Environment variable naming
- [name-variables-lowercase-local](./name-variables-lowercase-local.md) - Local variable naming
