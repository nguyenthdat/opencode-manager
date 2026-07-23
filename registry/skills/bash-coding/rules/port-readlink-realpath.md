# port-readlink-realpath

> Don't assume `readlink -f` / `realpath` is available

## Why It Matters

`readlink -f` and `realpath` are not available on macOS by default (they need coreutils installed via Homebrew). Scripts that rely on these commands fail on macOS and some BSD systems. Use a portable fallback using `cd` and `pwd`, or check for availability and provide alternatives.

## Bad

```bash
#!/usr/bin/env bash
# Breaks on macOS without coreutils

script_dir="$(dirname "$(readlink -f "$0")")"

abs_path="$(realpath "$file")"

canonical="$(readlink -f "$symlink")"
```

## Good

```bash
#!/usr/bin/env bash

# Portable SCRIPT_DIR (works on macOS/Linux/BSD)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Portable realpath-like function
resolve_path() {
    local path="$1"
    # If realpath exists, use it
    if command -v realpath >/dev/null 2>&1; then
        realpath "$path"
        return
    fi
    # Fallback for macOS/BSD
    if [[ -d "$path" ]]; then
        (cd "$path" && pwd)
    else
        local dir="$(dirname "$path")"
        local base="$(basename "$path")"
        local resolved_dir
        resolved_dir="$(cd "$dir" 2>/dev/null && pwd)" || return 1
        echo "${resolved_dir}/${base}"
    fi
}

# Canonicalize symlink (portable)
canonicalize() {
    local path="$1"
    if command -v readlink >/dev/null 2>&1; then
        readlink -f "$path" 2>/dev/null || readlink "$path"
    else
        perl -MCwd -e 'print Cwd::abs_path(shift)' "$path"
    fi
}

script_dir="$(resolve_path "$(dirname "${BASH_SOURCE[0]}")")"
```

## See Also

- [port-command-v-which](./port-command-v-which.md) - Checking command availability
- [fn-library-source](./fn-library-source.md) - Sourcing libraries reliably
