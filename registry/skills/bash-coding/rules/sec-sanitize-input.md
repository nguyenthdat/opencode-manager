# sec-sanitize-input

> Validate and sanitize user input before use

## Why It Matters

Shell scripts often accept input from command-line arguments, files, environment variables, or network sources. Using unsanitized input in commands, file paths, or variable assignments is dangerous. Validation ensures input matches expected patterns, preventing injection, path traversal, and other attacks.

## Bad

```bash
# No validation — path traversal risk
filename="$1"
cat "/var/data/${filename}"    # User enters "../../../etc/passwd" => system file exposed

# No validation — injection via environment
file="${INPUT_FILE}"
rm "$file"                     # Empty or malicious path

# Using raw input in command name
tool="$1"
"$tool" --help                 # User enters "rm" or "reboot"
```

## Good

```bash
validate_filename() {
    local name="$1"
    # Reject path separators, null bytes, leading dashes
    if [[ "$name" =~ [/\\] ]] || [[ "$name" == -* ]]; then
        echo "ERROR: Invalid filename: ${name}" >&2
        return 1
    fi
    # Reject empty
    if [[ -z "$name" ]]; then
        echo "ERROR: Empty filename" >&2
        return 1
    fi
}

filename="$1"
validate_filename "$filename" || exit 1
cat "/var/data/${filename}"

# Whitelist approach
allowed_tools="awk cut sed sort uniq wc"
if ! grep -qw "$tool" <<< "$allowed_tools"; then
    echo "ERROR: Tool '$tool' not in allowed list" >&2
    exit 1
fi

# Validate numeric input
if [[ ! "$port" =~ ^[0-9]+$ ]] || (( port < 1 || port > 65535 )); then
    echo "ERROR: Invalid port number: ${port}" >&2
    exit 1
fi

# Validate path is within a base directory
validate_path() {
    local base="$1"
    local path="$2"
    local real_path
    real_path="$(realpath "${base}/${path}" 2>/dev/null)" || return 1
    [[ "$real_path" == "$base"/* ]] || return 1
}
```

## See Also

- [sec-path-injection](./sec-path-injection.md) - PATH injection risks
- [sec-no-exec-user-test](./sec-no-exec-user-test.md) - Don't use user input in command names
