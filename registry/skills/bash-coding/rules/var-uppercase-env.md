# var-uppercase-env

> UPPER_CASE for environment variables and globals

## Why It Matters

Consistent casing makes shell scripts easier to read and maintain. UPPER_CASE for environment and global variables signals their scope and importance, while lowercase for local variables prevents accidental collision with reserved environment variable names (like `PATH`, `HOME`, `USER`). The convention is widely adopted across all major shell codebases.

## Bad

```bash
# Mixed casing is confusing
Path="/usr/local/bin"
userName="john"

# Global variable looks local
config_file="/etc/app.conf"  # Actually global

# Using reserved names
path="/custom/path"   # Overwrites PATH?

# Local and global indistinguishable
count=0
```

## Good

```bash
# Environment / exported globals in UPPER_CASE
readonly APP_NAME="myapp"
readonly CONFIG_DIR="${HOME}/.config/myapp"
export PATH="/usr/local/bin:${PATH}"
export EDITOR="vim"

# Local variables in lowercase
my_function() {
    local config_file="/etc/app.conf"
    local user_name="john"
    local count=0
}

# Namespaced globals when needed
readonly MYAPP_DB_HOST="localhost"
readonly MYAPP_DB_PORT=5432
```

## Naming Convention Summary

| Scope | Case | Example |
|-------|------|---------|
| Environment / exported | UPPER_CASE | `PATH`, `DB_HOST` |
| Global constants | UPPER_CASE | `MAX_RETRIES` |
| Function-local | lowercase_with_underscores | `config_file` |
| Loop index | single lowercase | `i`, `j` |
| Temporary (internal) | `_lowercase` | `_tmp` |

## See Also

- [name-variables-uppercase-env](./name-variables-uppercase-env.md) - Detailed naming rules
- [name-variables-lowercase-local](./name-variables-lowercase-local.md) - Local variable naming
