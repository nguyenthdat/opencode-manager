# debug-verbose-flag

> Support `--verbose`/`-v` flag for debug output

## Why It Matters

Debug output is useful during development and troubleshooting but noisy for normal operation. A `--verbose` or `-v` flag lets users opt into detailed output without modifying the script. This is the standard Unix convention (think `-v` on `grep`, `tar`, `ssh`) and makes scripts more user-friendly and debuggable.

## Bad

```bash
#!/usr/bin/env bash

# Debug output always shown — clutters normal output
echo "Processing ${file} with options ${opts}"
echo "Command: transform --input ${file} --output ${out}"
echo "Return code: $?"

# Debug output never shown — can't troubleshoot
# (no verbose option available)
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

declare VERBOSE=0

while (($# > 0)); do
    case "$1" in
        -v|--verbose) VERBOSE=1; shift ;;
        *) break ;;
    esac
done

verbose() {
    ((VERBOSE)) && echo "[VERBOSE] $*" >&2
}

process_file() {
    local file="$1"
    verbose "Processing ${file}"
    verbose "Running: transform '${file}'"
    transform "$file"
    verbose "Completed: ${file}"
}

# Usage
process_file "data.txt"           # Normal: silent
# ./script -v                     # Verbose: shows all verbose messages
# ./script --verbose data.txt     # Verbose: shows all verbose messages
```

## See Also

- [debug-log-function](./debug-log-function.md) - Structured log function
- [err-dry-run-pattern](./err-dry-run-pattern.md) - Dry run flag pattern
