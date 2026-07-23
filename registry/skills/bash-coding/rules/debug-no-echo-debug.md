# debug-no-echo-debug

> Use stderr for debug, stdout for program output

## Why It Matters

Mixing debug output on stdout contaminates program output — any script that produces data on stdout becomes unusable in pipelines (`script.sh | next_command`) because debug messages get piped along with data. Writing debug/diagnostic output to stderr (file descriptor 2) keeps stdout clean for program data.

## Bad

```bash
#!/usr/bin/env bash

echo "Processing file: $file"     # Debug on stdout
transform "$file" > output.txt
echo "Done processing"            # Debug on stdout

# Pipe breaks:
# ./script.sh | jq '.'  # "Processing file: data.txt" is not valid JSON!
```

## Good

```bash
#!/usr/bin/env bash

echo "Processing file: $file" >&2   # Debug on stderr
transform "$file" > output.txt
echo "Done processing" >&2          # Debug on stderr

# Pipe works:
# ./script.sh | jq '.'  # Only JSON goes through pipe

# Structured debugging
debug() { echo "[DEBUG] $*" >&2; }
info() { echo "[INFO] $*" >&2; }
warn() { echo "[WARN] $*" >&2; }
error() { echo "[ERROR] $*" >&2; }

# Program output on stdout
output_data() { echo "$@"; }
```

## Stream Separation

```bash
# stdout (1): Program output, data, results
echo "JSON or CSV here" >&1

# stderr (2): Debug, logs, diagnostics, errors
echo "Debug info" >&2

# Usage:
./script.sh > data.json 2> debug.log     # Separate files
./script.sh 2>/dev/null                  # Suppress debug
./script.sh 2>&1 | grep ERROR           # Search across both
./script.sh | next_command               # Only data to next command
```

## See Also

- [io-stderr-redirect](./io-stderr-redirect.md) - Stderr redirection
- [debug-log-function](./debug-log-function.md) - Structured logging
