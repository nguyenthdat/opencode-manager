# var-indirect-reference

> Use `declare -n` (nameref) instead of `eval` for indirect variable access

## Why It Matters

Indirect variable access — where the name of the variable to read or write is stored in another variable — is a common pattern in shell scripts. `eval` was historically used for this but introduces severe security risks and quoting nightmares. Bash's `declare -n` (nameref, available since 4.3) provides a safe, clean alternative.

## Bad

```bash
# eval is dangerous and error-prone
varname="USER"
eval "echo \$$varname"           # Security risk

# Even worse — eval with user input
eval "$user_var=\$value"         # Code injection!

# Quoting nightmare
eval "echo \"\${$varname}_suffix\""
```

## Good

```bash
# Bash 4.3+: declare -n for namerefs
get_config() {
    local -n ref="$1"
    ref="${2:-default}"
}

config_file=""
get_config config_file "/etc/app.conf"
echo "$config_file"  # /etc/app.conf

# Read through nameref
print_value() {
    local -n ref="$1"
    echo "Value of $1: $ref"
}
name="Alice"
print_value name   # Value of name: Alice

# Array namerefs work too
process_items() {
    local -n arr="$1"
    local item
    for item in "${arr[@]}"; do
        echo "  - $item"
    done
}
declare -a files=("a.txt" "b.txt")
process_items files
```

## POSIX Alternative (No nameref)

```bash
# Use eval carefully with known variable names only
get_config() {
    eval "$1=\${2:-default}"
}
# Only safe when $1 is a developer-controlled name, never user input
```

## See Also

- [var-no-eval-expand](./var-no-eval-expand.md) - Why eval is dangerous
- [arr-pass-to-function](./arr-pass-to-function.md) - Passing arrays by nameref
