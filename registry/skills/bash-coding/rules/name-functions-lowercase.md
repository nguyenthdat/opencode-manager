# name-functions-lowercase

> lowercase function names; avoid UpperCase

## Why It Matters

POSIX reserves uppercase names for shell builtins, utilities, and future standardization. Using lowercase function names avoids collisions with system commands and makes it clear which names are user-defined. This convention is universal in the shell community: environment variables are `UPPER_CASE`, functions are `lowercase`.

## Bad

```bash
# Uppercase functions look like builtins
ECHO() { echo "[$(date)]: $*"; }
KILL_PROCESS() { kill "$1"; }
GET() { curl -s "$1"; }

# Mixed naming conventions
ProcessFile() { :; }
getUserData() { :; }
JSON_Parse() { :; }

# Names that shadow builtins
cd() { builtin cd "$1" && ls; }   # Dangerous override
echo() { command echo "[app] $*"; }
```

## Good

```bash
# Lowercase with underscores (snake_case)
echo_timestamp() { echo "[$(date)]: $*"; }
kill_process() { kill "$1"; }
http_get() { curl -s "$1"; }

# Consistent naming
process_file() { :; }
get_user_data() { :; }
parse_json() { :; }

# Namespaced library functions
log_info() { :; }
log_error() { :; }
db_connect() { :; }
db_query() { :; }

# Action-oriented names
backup_files() { :; }
validate_input() { :; }
send_notification() { :; }
```

## Function Naming Patterns

| Pattern | Use |
|---------|-----|
| `verb_noun` | General actions: `process_file`, `validate_input` |
| `noun_action` | Object-specific: `file_exists`, `config_get` |
| `prefix_action` | Library namespacing: `log_info`, `db_query` |
| `is_*` / `has_*` | Boolean functions: `is_root`, `has_docker` |

## See Also

- [fn-lowercase-names](./fn-lowercase-names.md) - Related rule with POSIX details
- [name-library-prefix](./name-library-prefix.md) - Library prefix conventions
