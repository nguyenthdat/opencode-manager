# fn-library-source

> Source library scripts; don't copy-paste functions

## Why It Matters

Copy-pasting functions between scripts creates maintenance nightmares — a bug fix in one copy doesn't reach the others. Instead, extract shared functions into library files and `source` them. This keeps scripts DRY, ensures consistency, and makes testing shared functions possible in isolation. Use `SCRIPT_DIR` pattern for reliable sourcing regardless of CWD.

## Bad

```bash
#!/usr/bin/env bash
# script_a.sh

# Copy-pasted from script_b.sh
log_info() { echo "[INFO] $(date): $*"; }
log_error() { echo "[ERROR] $(date): $*" >&2; }
check_deps() { for cmd in "$@"; do command -v "$cmd" >/dev/null || return 1; done; }

main() {
    log_info "Starting..."
    check_deps curl jq || { log_error "Missing deps"; exit 1; }
}
```

## Good

```bash
#!/usr/bin/env bash
# lib/logging.sh — shared library

log_info() { echo "[INFO] $(date -Iseconds): $*"; }
log_error() { echo "[ERROR] $(date -Iseconds): $*" >&2; }
log_debug() { [[ "${DEBUG:-}" ]] && echo "[DEBUG] $(date -Iseconds): $*" >&2; }

# lib/checks.sh — shared library
check_deps() {
    local missing=() cmd
    for cmd in "$@"; do
        command -v "$cmd" &>/dev/null || missing+=("$cmd")
    done
    ((${#missing[@]} == 0)) && return 0
    log_error "Missing dependencies: ${missing[*]}"
    return 1
}

# script_a.sh — uses libraries
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/logging.sh"
source "${SCRIPT_DIR}/lib/checks.sh"

main() {
    log_info "Starting..."
    check_deps curl jq || exit 1
}
```

## Library Design

```bash
# lib/config.sh — namespace functions with library prefix
config_load() { :; }
config_get() { :; }
config_set() { :; }

# lib/db.sh
db_connect() { :; }
db_query() { :; }
db_close() { :; }

# Sourcing with error handling
require_lib() {
    local lib="$1"
    if [[ ! -f "$lib" ]]; then
        echo "FATAL: Library not found: ${lib}" >&2
        exit 1
    fi
    # shellcheck disable=SC1090
    source "$lib"
}

require_lib "${SCRIPT_DIR}/lib/logging.sh"
```

## See Also

- [name-library-prefix](./name-library-prefix.md) - Prefixing library functions
- [anti-source-without-path](./anti-source-without-path.md) - The anti-pattern
