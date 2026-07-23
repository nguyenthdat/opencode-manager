# err-errexit-set

> Use `set -euo pipefail` at top of scripts

## Why It Matters

By default, Bash continues executing after command failures, silently producing incorrect results or corrupting data. `set -e` (errexit) exits on any non-zero exit status, `set -u` (nounset) treats unset variables as errors, and `set -o pipefail` makes pipelines fail if any component fails. Together, these three options catch the vast majority of scripting errors early.

## Bad

```bash
#!/usr/bin/env bash
# No safety options — silent failures ahead!

cd /nonexistent/dir
echo "Still running"     # This still executes despite cd failure!

rm "$temp_file"
echo "Cleanup done"      # Runs even if rm failed

grep "pattern" "$file" | awk '{print $1}'
# If grep fails, awk processes nothing — no error
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

cd /nonexistent/dir    # Script exits immediately with error
echo "Never reached"

# Temporarily allow failure for specific commands
set +e
grep "optional" "$file"  # Failure is OK
status=$?
set -e
if (( status != 0 )); then
    echo "Pattern not found"
fi

# Or use || true for expected failures
rm -f "$temp_file" || true    # File may not exist

# Conditionals don't trigger errexit
if cd /some/dir; then
    process_files .
fi
```

## Common set Options

```bash
set -e  # Exit on error (errexit)
set -u  # Error on unset variable (nounset)
set -o pipefail  # Pipe fails if any component fails
set -x  # Print commands as they execute (xtrace)
set -v  # Print shell input lines as read (verbose)
shopt -s nullglob  # Non-matching globs expand to nothing
shopt -s failglob  # Non-matching globs cause error (stricter)
```

## See Also

- [err-pipefail-required](./err-pipefail-required.md) - Pipefail importance
- [err-set-e-cautious](./err-set-e-cautious.md) - Edge cases with set -e
