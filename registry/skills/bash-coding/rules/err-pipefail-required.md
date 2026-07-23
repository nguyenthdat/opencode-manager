# err-pipefail-required

> Always use `set -o pipefail` to catch pipe errors

## Why It Matters

Without `pipefail`, a pipeline's exit status is the exit status of the *last* command only. This means `grep pattern file | awk '{print $1}'` returns success even if `grep` fails, because `awk` runs successfully on empty input. With `pipefail`, the pipeline fails if *any* component fails, catching hidden errors in the middle of pipelines.

## Bad

```bash
#!/usr/bin/env bash
# No pipefail — silent pipe failures

# grep fails but awk succeeds on empty input — pipeline reports success
grep "pattern" "$file" | awk '{print $1}' > output.txt
echo "Success!"  # Executes even if grep failed!

# curl fails but jq parses nothing — no error detected
curl -s "$api_url" | jq '.data' > result.json

# sort fails but uniq runs — data silently corrupted
generate_data | sort -u | uniq -c
```

## Good

```bash
#!/usr/bin/env bash
set -o pipefail

# Now pipe failures are caught
grep "pattern" "$file" | awk '{print $1}' > output.txt
echo "This runs only if grep AND awk succeed"

# Check specific pipe component if needed
if ! output=$(curl -s "$api_url" | jq '.data' 2>&1); then
    echo "API call or jq parsing failed"
    exit 1
fi

# Use PIPESTATUS for component-level diagnostics
cmd1 | cmd2 | cmd3
declare -a pipe_status=("${PIPESTATUS[@]}")
if (( pipe_status[0] != 0 )); then
    echo "cmd1 failed with ${pipe_status[0]}"
elif (( pipe_status[1] != 0 )); then
    echo "cmd2 failed with ${pipe_status[1]}"
fi
```

## PIPESTATUS Deep Dive

```bash
set -o pipefail

# Check individual pipe exit codes
output=$(false | true)
echo "${PIPESTATUS[0]} ${PIPESTATUS[1]}"  # "1 0"

# Safe: capture immediately
output=$(cmd1 | cmd2)
declare -a status=("${PIPESTATUS[@]}")
if (( status[0] != 0 )); then
    log_error "cmd1 failed"
fi
```

## See Also

- [err-errexit-set](./err-errexit-set.md) - Complete safety options
- [err-check-exit-status](./err-check-exit-status.md) - Checking $? after commands
