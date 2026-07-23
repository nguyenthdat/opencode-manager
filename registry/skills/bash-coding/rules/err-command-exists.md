# err-command-exists

> Check `command -v` before using external tools

## Why It Matters

Shell scripts often depend on external tools like `jq`, `curl`, `git`, or `docker`. If these are missing, the script fails with cryptic "command not found" errors deep in execution. Checking dependencies upfront with `command -v` provides clear, early failure messages and allows graceful degradation or installation guidance.

## Bad

```bash
#!/usr/bin/env bash
set -e

# Script fails deep in execution with mysterious error
data="$(curl -s "$API_URL")"
parsed="$(echo "$data" | jq '.items')"
# If jq is not installed: "jq: command not found" — user confused
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

check_dependencies() {
    local missing=()
    local cmd

    for cmd in curl jq git docker; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done

    if ((${#missing[@]} > 0)); then
        echo "ERROR: Missing required commands: ${missing[*]}" >&2
        echo "Install with: brew install ${missing[*]}" >&2
        exit 1
    fi
}

check_dependencies

# Or check individually with version requirements
require_cmd() {
    local cmd="$1"
    local min_version="${2:-}"
    if ! command -v "$cmd" &>/dev/null; then
        echo "ERROR: '$cmd' is required but not installed" >&2
        exit 1
    fi
    if [[ -n "$min_version" ]]; then
        local version
        version="$("$cmd" --version 2>&1 | head -1)"
        echo "Found: $version"
    fi
}

require_cmd "jq" "1.6"
require_cmd "git" "2.30"
```

## Why `command -v` over `which`

```bash
# command -v: POSIX standard, shell builtin, handles aliases/functions
command -v python3    # /usr/bin/python3 (or "python3 is a function")

# which: external command, not POSIX, inconsistent across systems
which python3         # fragile, behaves differently on different OSes

# type: bash builtin, more verbose, also shows type
type -P python3       # Bash-specific path lookup
```

## See Also

- [port-command-v-which](./port-command-v-which.md) - Why command -v beats which
- [err-no-unchecked-cd](./err-no-unchecked-cd.md) - Checking cd success
