# var-no-eval-expand

> Never use `eval` for variable expansion

## Why It Matters

`eval` executes its arguments as shell code, making it a code injection vector. When variable expansion is the goal, Bash provides safe alternatives: namerefs (`declare -n`), indirect expansion (`${!var}`), and associative arrays. Using `eval` for expansion is unnecessary and dangerous — user-supplied data could execute arbitrary commands.

## Bad

```bash
# eval for indirect expansion — dangerous!
varname="$1"
eval "value=\$$varname"
echo "$value"

# eval with user input — code injection risk
eval "result=\${$user_supplied}"

# eval for default assignment
eval ": \${$varname:=$default}"

# eval in a loop with formatted strings
for i in 1 2 3; do
    eval "count_$i=\$((count_$i + 1))"
done
```

## Good

```bash
# Bash: use indirect expansion ${!var}
varname="$1"
value="${!varname}"
echo "$value"

# Bash 4.3+: use nameref
print_config() {
    local -n ref="$1"
    echo "${ref:-unset}"
}
print_config "LOG_LEVEL"

# Use associative arrays instead of dynamic variable names
declare -A counts
((counts["$key"]++))
echo "${counts[$key]}"

# POSIX: use a subshell with explicit variable passing
# (no direct POSIX equivalent for indirect expansion)
```

## Security Note

```bash
# This is extremely dangerous — NEVER do this
read -r user_input
eval "echo \$$user_input"
# User input: "; rm -rf / ; echo " — catastrophic!

# Even with "sanitized" input, eval is fragile
eval "foo_$key=\$value"  # What if key="bar ; malicious_command"?
```

## See Also

- [var-indirect-reference](./var-indirect-reference.md) - Safe indirect access with nameref
- [sec-no-eval-user](./sec-no-eval-user.md) - Security implications of eval
- [anti-eval-everything](./anti-eval-everything.md) - The anti-pattern
