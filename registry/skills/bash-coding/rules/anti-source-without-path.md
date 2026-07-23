# anti-source-without-path

> Don't `source` scripts without specifying path

## Why It Matters

`source script.sh` (or `. script.sh`) without a path searches `$PATH` for the file — a security risk if an attacker can place a malicious `script.sh` earlier in PATH. It's also fragile: the wrong file may be sourced depending on the environment. Always use a relative (`./script.sh`) or absolute path. `source ./lib.sh` is explicit and safe.

## Bad

```bash
# Searches PATH — security risk, fragile
source lib.sh           # Which lib.sh? Could be /tmp/lib.sh!
. helpers               # What if there's a /usr/bin/helpers?

# Assumes the file is in PATH
source logging.sh       # Fails if . is not in PATH
```

## Good

```bash
# Explicit path — safe and clear
source ./lib.sh
. ./helpers.sh

# Absolute path via SCRIPT_DIR
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/logging.sh"
source "${SCRIPT_DIR}/lib/config.sh"

# Check file exists before sourcing
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

- [fn-library-source](./fn-library-source.md) - Library sourcing patterns
- [sec-path-injection](./sec-path-injection.md) - PATH security risks
