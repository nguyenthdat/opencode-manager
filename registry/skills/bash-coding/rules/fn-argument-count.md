# fn-argument-count

> Check `$#` for required argument count

## Why It Matters

Shell functions don't have formal parameter declarations — any number of arguments can be passed, and missing arguments silently become empty strings. Without explicit argument count checking, missing arguments lead to confusing errors deep in the function body. Validate `$#` at the start of every function that requires arguments.

## Bad

```bash
# No argument validation — cryptic errors
connect_to() {
    local host="$1"
    local port="$2"
    ssh -p "$port" "$host"     # If no port given: ssh -p "" — errors!
}

download_file() {
    local url="$1"
    local dest="$2"
    curl "$url" > "$dest"      # If no dest: redirect fails silently
}

connect_to   # No args; proceeds anyway
```

## Good

```bash
# Validate argument count upfront
connect_to() {
    if (($# < 2)); then
        echo "Usage: connect_to <host> <port>" >&2
        return 1
    fi
    local host="$1"
    local port="$2"
    ssh -p "$port" "$host"
}

# Named arguments with defaults
download_file() {
    if (($# < 1)); then
        echo "Usage: download_file <url> [destination]" >&2
        return 1
    fi
    local url="$1"
    local dest="${2:-$(basename "$url")}"
    curl "$url" -o "$dest"
}

# Variadic function (0 to N args)
process_files() {
    if (($# == 0)); then
        echo "No files to process" >&2
        return 0   # Not an error, just nothing to do
    fi
    local file
    for file in "$@"; do
        process "$file"
    done
}
```

## See Also

- [fn-argument-names](./fn-argument-names.md) - Naming function arguments
- [fn-usage-help](./fn-usage-help.md) - Providing usage information
