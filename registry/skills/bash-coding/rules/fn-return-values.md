# fn-return-values

> Capture function output with `$(...)`; use `return` for status

## Why It Matters

Shell functions return two things: an exit status (0-255) via `return`, and data via stdout. Confusing these two is a common source of bugs. Use `return` for success/failure indication (checked with `if`, `&&`, `||`) and `$(...)` to capture data output. Never use `echo` return values for status or expect `return` to pass data back.

## Bad

```bash
# Using stdout for status — data and status mixed
get_user() {
    if grep -q "$1" /etc/passwd; then
        echo "found"       # "found" is data, not a meaningful status
    else
        echo "not_found"
    fi
}

if [ "$(get_user bob)" = "found" ]; then  # String comparison, fragile
    echo "User exists"
fi
```

## Good

```bash
# return for status, stdout for data
get_user() {
    local username="$1"
    local result
    result="$(grep "^${username}:" /etc/passwd)" || return 1
    echo "$result"
    return 0
}

if user_entry="$(get_user "bob")"; then
    echo "Found: $user_entry"
else
    echo "User not found"
fi

# Multiple return values via printing
split_path() {
    local path="$1"
    echo "${path%/*}"   # Directory
    echo "${path##*/}"  # Filename
}

IFS=$'\n' read -r dirname filename < <(split_path "/usr/bin/script.sh")
echo "Dir: $dirname, File: $filename"
```

## Return Value Patterns

```bash
# Return 0 = success, non-zero = failure
is_root() { [[ "$EUID" -eq 0 ]]; }
if is_root; then echo "Running as root"; fi

# Function output captured with $()
config_value="$(get_config "db.host")"

# Both output and status
if output="$(dangerous_command 2>&1)"; then
    echo "Success: $output"
else
    echo "Failed: $output"
fi
```

## See Also

- [fn-argument-count](./fn-argument-count.md) - Checking argument count
- [err-return-over-exit-fn](./err-return-over-exit-fn.md) - Return vs exit in functions
