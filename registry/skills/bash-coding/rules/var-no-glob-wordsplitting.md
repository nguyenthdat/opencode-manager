# var-no-glob-wordsplitting

> Set IFS carefully; disable word splitting for safety

## Why It Matters

Word splitting and glob expansion are the two silent transformations that happen on unquoted expansions. Word splitting uses `IFS` characters (space, tab, newline by default) to split variables into multiple words. Glob expands `*`, `?`, `[` to matching filenames. Together they are a leading cause of bugs. Understanding and controlling these behaviors is essential for correct shell scripting.

## Bad

```bash
# Unquoted expansion — word splitting AND globbing
args="-l -a"
ls $args             # Words split; * expanded if present

# IFS modified globally but not restored
IFS=:
for item in $items; do  # Breaks expectations everywhere else
    process "$item"
done

# Relying on default IFS for parsing
data="name:age:city"
IFS=: read -r name age city <<< "$data"
# IFS change leaks into rest of script
```

## Good

```bash
# Set restricted IFS at script start
IFS=$'\n\t'
# Now word splitting only happens on newlines and tabs, not spaces

# Use local IFS change in subshell
parsed="$(IFS=:; set -- $data; echo "$1")"

# Local IFS change for a single read
while IFS=: read -r name age city; do
    process "$name" "$age" "$city"
done < "$input_file"

# Prefer arrays over IFS splitting for lists
readarray -t lines < "$file"
for line in "${lines[@]}"; do
    process "$line"
done

# Disable globbing temporarily when needed
set -o noglob
# ... code that must not glob ...
set +o noglob
```

## IFS Best Practices

```bash
# Safe defaults at top of every script
set -euo pipefail
IFS=$'\n\t'

# Reset IFS only in local scopes
my_parse() {
    local old_ifs="$IFS"
    IFS=:
    # ... IFS-dependent code ...
    IFS="$old_ifs"
}
```

## See Also

- [var-always-quote](./var-always-quote.md) - Quoting prevents word splitting entirely
- [sec-no-unquoted-expansion](./sec-no-unquoted-expansion.md) - Security angle
