# name-library-prefix

> Prefix library functions with namespace_ (e.g., `log_info`)

## Why It Matters

When sourcing multiple library files, function name collisions become a real problem. Two libraries might both define `info()` or `error()`, and the last one sourced wins. Prefixing each library's functions with a short namespace (e.g., `log_`, `db_`, `config_`) prevents conflicts and makes it clear which library a function belongs to.

## Bad

```bash
# lib/logging.sh
info() { echo "[INFO] $*"; }
error() { echo "[ERROR] $*" >&2; }
warn() { echo "[WARN] $*" >&2; }

# lib/db.sh
info() { echo "DB: $*"; }     # COLLISION! Overwrites logging info()
connect() { :; }               # Generic name, likely collision

# lib/config.sh
load() { :; }                   # Too generic
get() { :; }                    # Too generic
```

## Good

```bash
# lib/logging.sh — all functions prefixed with log_
log_info() { echo "[INFO] $(date -Iseconds): $*"; }
log_error() { echo "[ERROR] $(date -Iseconds): $*" >&2; }
log_warn() { echo "[WARN] $(date -Iseconds): $*" >&2; }
log_debug() { [[ "${DEBUG:-}" ]] && echo "[DEBUG] $*" >&2; }

# lib/db.sh — all functions prefixed with db_
db_connect() { :; }
db_query() { :; }
db_disconnect() { :; }
db_is_connected() { return 0; }

# lib/config.sh — all functions prefixed with config_
config_load() { :; }
config_get() { :; }
config_set() { :; }
config_has_key() { return 0; }
```

## Prefix Guidelines

```bash
# Keep prefixes short (2-5 chars), meaningful, lowercase
# Good prefixes:
log_    # Logging functions
db_     # Database operations
http_   # HTTP requests
fs_     # Filesystem operations
str_    # String utilities
json_   # JSON processing
yaml_   # YAML processing

# Avoid:
logging_  # Too long
L_        # Too cryptic
_         # Reserved for internal/private
```

## See Also

- [fn-library-source](./fn-library-source.md) - Sourcing library files
- [name-functions-lowercase](./name-functions-lowercase.md) - Function naming conventions
