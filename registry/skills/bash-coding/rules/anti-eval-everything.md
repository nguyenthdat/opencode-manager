# anti-eval-everything

> Don't use `eval`; find builtin alternatives

## Why It Matters

`eval` is a code-execution primitive — it runs arbitrary strings as shell commands. It's the shell equivalent of `exec()` in Python or `eval()` in JavaScript, with the same dangers. Most uses of `eval` have safer alternatives: namerefs for indirect variables, associative arrays for dynamic keys, or function dispatch for dynamic commands.

## Bad

```bash
# eval for dynamic variable access
eval "echo \$$varname"
eval "${key}=\"${value}\""

# eval for arithmetic
eval "result=\$(( $expression ))"

# eval with user input — catastrophic
eval "$user_command"
```

## Good

```bash
# Nameref (Bash 4.3+) instead of eval
declare -n ref="$varname"
echo "$ref"

# Associative array instead of dynamic variables
declare -A config
config["$key"]="$value"
echo "${config[$key]}"

# Arithmetic expansion — no eval needed
result="$(( expression ))"

# Function dispatch — no eval
declare -A handlers=([start]=start_service [stop]=stop_service)
if [[ -n "${handlers[$action]:-}" ]]; then
    "${handlers[$action]}"
fi
```

## See Also

- [sec-no-eval-user](./sec-no-eval-user.md) - Security of eval
- [var-indirect-reference](./var-indirect-reference.md) - Safe indirect access
