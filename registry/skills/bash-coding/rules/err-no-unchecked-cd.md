# err-no-unchecked-cd

> Always check `cd` success: `cd dir || exit 1`

## Why It Matters

If `cd` fails (directory doesn't exist, permission denied, broken symlink), subsequent commands run in the wrong directory. This can cause data loss — deleting files in the current directory instead of the intended one, or writing to the wrong location. Always verify `cd` succeeded before continuing.

## Bad

```bash
#!/usr/bin/env bash
set -e   # errexit alone catches cd failure, but...

cd "$WORK_DIR"
rm *      # If cd failed, this deletes files in the current directory!

cd "$DEPLOY_DIR"
rsync -av . server:/app/   # Wrong directory deployed!

# Pushed directory assumption
pushd "$old_dir"
# ... many lines ...
popd  # Did pushd work?
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

cd "$WORK_DIR" || {
    echo "ERROR: Cannot change to ${WORK_DIR}" >&2
    exit 1
}

# Or: exit with meaningful message
cd "$DEPLOY_DIR" || {
    echo "FATAL: Deployment directory ${DEPLOY_DIR} not found" >&2
    exit 2
}

# Or: create the directory if needed
if ! cd "$CACHE_DIR" 2>/dev/null; then
    mkdir -p "$CACHE_DIR"
    cd "$CACHE_DIR"
fi

# pushd/popd with check
if pushd "$backup_dir" >/dev/null; then
    cleanup_backups
    popd >/dev/null
else
    echo "Cannot access backup directory" >&2
fi

# Use a subshell to contain directory changes
(
    cd "$WORK_DIR" || exit 1
    process_files
)
# Back in original directory regardless
```

## See Also

- [anti-cd-without-check](./anti-cd-without-check.md) - The anti-pattern
- [err-errexit-set](./err-errexit-set.md) - Using set -e to catch cd failures
