# anti-cd-without-check

> Always check `cd` success

## Why It Matters

If `cd` fails (permission denied, directory removed, broken symlink), the script continues executing in the wrong directory. This can mean deleting files in $HOME instead of /tmp, deploying to the wrong server, or writing data to the wrong location. Always check `cd` with `||`, or use `set -e` which catches `cd` failures automatically.

## Bad

```bash
cd "$WORK_DIR"
rm -rf *          # If cd failed, deletes from current directory!

cd "$DEPLOY_DIR"
rsync -avz . server:/app/   # Deploys wrong files!

cd /nonexistent
echo "You are now in: $PWD"   # Still in old directory
```

## Good

```bash
cd "$WORK_DIR" || { echo "Cannot change to ${WORK_DIR}" >&2; exit 1; }
rm -rf *

cd "$DEPLOY_DIR" || { echo "Deployment directory missing" >&2; exit 1; }
rsync -avz . server:/app/

# Or use a subshell to contain directory changes
(
    cd "$WORK_DIR" || exit 1
    process_files
)
# Back in original directory regardless
```

## See Also

- [err-no-unchecked-cd](./err-no-unchecked-cd.md) - Checking cd success
- [err-errexit-set](./err-errexit-set.md) - set -e catches cd failures
