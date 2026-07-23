# fn-main-function

> Put main logic in `main()` function; call at end

## Why It Matters

Placing script logic in a `main()` function prevents global variable pollution, makes the script sourceable (for testing or library use), and provides a clear entry point. Functions defined after `main()` are available when `main()` runs, thanks to Bash's read-then-execute model. Scripts that can be sourced without executing are more reusable and testable.

## Bad

```bash
#!/usr/bin/env bash
set -euo pipefail

# Top-level code executes on source — not testable
config_file="${1:-/etc/app.conf}"
parse_config "$config_file"
process_data
send_report
cleanup
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

main() {
    local config_file="${1:-/etc/app.conf}"
    parse_config "$config_file"
    process_data
    send_report
}

parse_config() { :; }
process_data() { :; }
send_report() { :; }

# Only run if executed, not if sourced
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## Complete Pattern

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Constants
readonly APP_NAME="myscript"
readonly APP_VERSION="1.0.0"

# Functions
usage() {
    cat <<'EOF'
Usage: myscript [options] <file>

Options:
  -h, --help     Show this help
  -v, --verbose  Verbose output
EOF
    exit 2
}

main() {
    local verbose=false

    while (($# > 0)); do
        case "$1" in
            -h|--help) usage ;;
            -v|--verbose) verbose=true; shift ;;
            --) shift; break ;;
            -*) echo "Unknown option: $1" >&2; usage ;;
            *) break ;;
        esac
    done

    if "$verbose"; then
        echo "Processing: $*"
    fi

    process "$@"
}

process() { :; }

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

## See Also

- [fn-usage-help](./fn-usage-help.md) - Usage function pattern
- [fn-library-source](./fn-library-source.md) - Creating sourcable libraries
