# var-prefix-suffix-remove

> Use `${var#prefix}`, `${var%suffix}`, `${var//pattern/replacement}`

## Why It Matters

Shell parameter expansion provides built-in string manipulation operators that are faster and safer than piping to `sed`, `cut`, or `awk`. These operators work entirely within the shell process (no fork), handle edge cases consistently, and don't require external tools that may vary across systems.

## Bad

```bash
# Forking to sed for simple string manipulation
filename="archive.tar.gz"
basename="$(echo "$filename" | sed 's/\.gz$//')"

# Piping through cut
extension="$(echo "$filename" | rev | cut -d. -f1 | rev)"

# Using grep/sed for pattern replacement
clean="$(echo "$text" | sed 's/foo/bar/g')"

# Multiple external calls
path="/usr/local/bin/script.sh"
dir="$(dirname "$path")"
name="$(basename "$path" .sh)"
```

## Good

```bash
filename="archive.tar.gz"

# Remove shortest suffix
name="${filename%.gz}"       # "archive.tar"

# Remove longest suffix
stem="${filename%%.*}"       # "archive"

# Remove shortest prefix
rest="${filename#*.}"        # "tar.gz"

# Remove longest prefix
ext="${filename##*.}"        # "gz"

# Pattern replacement
clean="${text//foo/bar}"     # Replace all occurrences
clean="${text/foo/bar}"      # Replace first occurrence

# Path manipulation
path="/usr/local/bin/script.sh"
dir="${path%/*}"             # "/usr/local/bin"
name="${path##*/}"           # "script.sh"
name_no_ext="${name%.*}"     # "script"

# Length
echo "${#path}"              # String length
```

## Operator Reference

| Operator | Action |
|----------|--------|
| `${var#pattern}` | Remove shortest match from beginning |
| `${var##pattern}` | Remove longest match from beginning |
| `${var%pattern}` | Remove shortest match from end |
| `${var%%pattern}` | Remove longest match from end |
| `${var/pat/repl}` | Replace first match |
| `${var//pat/repl}` | Replace all matches |
| `${var/#pat/repl}` | Replace at beginning |
| `${var/%pat/repl}` | Replace at end |
| `${#var}` | String length |

## See Also

- [perf-avoid-fork](./perf-avoid-fork.md) - Performance benefits of builtins
- [var-brace-variables](./var-brace-variables.md) - Brace syntax
