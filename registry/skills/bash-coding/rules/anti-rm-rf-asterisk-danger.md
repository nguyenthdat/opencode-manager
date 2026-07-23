# anti-rm-rf-asterisk-danger

> Never use `rm -rf $VAR/*` without validating `$VAR`

## Why It Matters

If `$VAR` is empty or unset, `rm -rf /*` or `rm -rf /some/path` becomes `rm -rf /*` — deleting the entire filesystem. This is not a joke; it's a real bug that has destroyed production systems. Always validate that the variable is set and non-empty before using it in destructive paths. Use `${var:?}` or explicit checks.

## Bad

```bash
#!/usr/bin/env bash
# Catastrophic bugs waiting to happen

cd "$BUILD_DIR"
rm -rf *           # If BUILD_DIR is unset, cd fails, rm deletes current dir!

rm -rf "$TMP_DIR/*"       # If TMP_DIR="", becomes rm -rf "/*" — OH NO
rm -rf "/${CACHE_DIR}"    # If CACHE_DIR="", becomes rm -rf "//" — root!
rm -rf $UNSET_VAR/*       # Becomes rm -rf "/*" — catastrophic
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

# Validate before destructive operations
cleanup_build() {
    local dir="${1:?Build directory must be specified}"   # set -u + :? guard

    # Additional validation: must be a subdirectory of expected location
    if [[ ! -d "$dir" ]]; then
        echo "ERROR: Build directory does not exist: ${dir}" >&2
        return 1
    fi

    if [[ "$dir" != /tmp/* && "$dir" != "${HOME}"/* ]]; then
        echo "ERROR: Refusing to delete outside /tmp or HOME: ${dir}" >&2
        return 1
    fi

    rm -rf "${dir:?}"/*
    echo "Cleaned: ${dir}"
}

# Safer pattern: cd && rm
cleanup_workdir() {
    local dir="$1"
    cd "${dir:?}" || return 1
    rm -rf -- *          # -- prevents files starting with - from being options
}

# Use :? to require non-empty
rm -rf "${TMP_DIR:?}"/*
```

## See Also

- [err-errexit-set](./err-errexit-set.md) - set -u catches unset variables
- [var-default-values](./var-default-values.md) - Using ${var:?message} for required variables
