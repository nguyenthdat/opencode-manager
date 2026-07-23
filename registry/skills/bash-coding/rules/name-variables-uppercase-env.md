# name-variables-uppercase-env

> UPPER_CASE for environment/export variables

## Why It Matters

Consistent casing rules make scripts easier to read and maintain. UPPER_CASE signals "this variable is exported/shared across processes" or "this is a global constant." The convention is universal across shell, C, and most programming languages for environment variables. Using lowercase for local variables prevents accidental collisions with system environment variables.

## Bad

```bash
#!/usr/bin/env bash

# Mixed casing makes scope unclear
db_host="localhost"       # Is this exported? Global? Local?
Port=8080                 # PascalCase?
logfile="/var/log/app"    # All lowercase global?

# Using reserved UPPER_CASE names
path="/custom/bin"        # Overwrites PATH if exported
home="$HOME/subdir"       # Confusing: $HOME vs $home
```

## Good

```bash
#!/usr/bin/env bash

# Exported/shared variables: UPPER_CASE
export DB_HOST="localhost"
export DB_PORT=5432
readonly APP_NAME="myapp"
readonly CONFIG_DIR="${HOME}/.config/myapp"

# Local variables: lowercase_with_underscores
my_function() {
    local db_host="$1"
    local port="$2"
    local log_file="/var/log/app"
}

# Global constants (not exported): UPPER_CASE
readonly MAX_RETRIES=3
readonly DEFAULT_TIMEOUT=30
```

## Casing Decision Matrix

| Scope | Case | Example |
|-------|------|---------|
| Environment variable (exported) | UPPER_CASE | `PATH`, `DB_HOST`, `API_KEY` |
| Global constant (readonly) | UPPER_CASE | `MAX_RETRIES`, `SCRIPT_DIR` |
| Global mutable (avoid!) | UPPER_CASE | `STATUS`, `TOTAL_COUNT` |
| Function-local | lowercase_with_underscores | `config_file`, `user_name` |
| Loop index | single lowercase | `i`, `j`, `n` |
| Temp/internal | `_lowercase` | `_tmp`, `_old_ifs` |

## See Also

- [var-uppercase-env](./var-uppercase-env.md) - Related rule
- [name-variables-lowercase-local](./name-variables-lowercase-local.md) - Local variable naming
