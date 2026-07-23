# fn-lowercase-names

> Use lowercase function names (POSIX namespace safety)

## Why It Matters

POSIX reserves uppercase names for shell builtins and future standards. Using lowercase function names avoids collisions with built-in commands and makes it clear which names are user-defined. The convention is widely followed in the shell community and prevents confusion between environment variables (UPPER_CASE) and functions (lowercase).

## Bad

```bash
# Uppercase function looks like a builtin or env var
ECHO() { echo "[$(date)]: $*"; }
KILL() { kill -9 "$1"; }
GET() {
    curl -s "$1"
}

# Mixing case conventions — confusing
ProcessFile() { :; }     # CamelCase: looks like a class/type
Get_User() { :; }        # Mix: inconsistent
```

## Good

```bash
# Lowercase with underscores (snake_case)
echo_timestamp() { echo "[$(date)]: $*"; }
force_kill() { kill -9 "$1"; }
http_get() { curl -s "$1"; }
process_file() { :; }
get_user() { :; }

# Namespaced with library prefix
log_info() { :; }
log_error() { :; }
db_connect() { :; }
db_query() { :; }

# Single-word functions
usage() { :; }
main() { :; }
cleanup() { :; }
```

## Reserved Name Patterns

```bash
# Avoid these patterns:
# - UPPER_CASE names (reserved for env vars/constants)
# - Names starting with _ (reserved for internal use)
# - Names matching builtins: cd, echo, exit, export, read, source, etc.
# - Names matching common commands: ls, grep, find, etc.

# If you must shadow a command, use namespace prefix:
find_files() { find "$@"; }       # Not: find() { ... }
my_echo() { echo "[app] $*"; }    # Not: echo() { ... }
```

## See Also

- [name-functions-lowercase](./name-functions-lowercase.md) - Detailed naming rules
- [name-library-prefix](./name-library-prefix.md) - Library function prefixes
