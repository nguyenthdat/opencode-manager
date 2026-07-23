# err-mkdir-parent

> Use `mkdir -p` to avoid "already exists" errors

## Why It Matters

`mkdir` without `-p` fails if the directory already exists or if parent directories don't exist. This creates fragile scripts that break on re-run or on systems with different directory layouts. `mkdir -p` creates parent directories as needed and doesn't error if the target already exists, making scripts idempotent and robust.

## Bad

```bash
#!/usr/bin/env bash
set -e

# Fails if parent doesn't exist
mkdir /var/cache/myapp/data
# mkdir: /var/cache/myapp: No such file or directory

# Fails on second run — directory already exists
mkdir /tmp/build
# mkdir: /tmp/build: File exists

# Workaround creates race condition
[ -d "$dir" ] || mkdir "$dir"
# What if directory is created between the check and the mkdir?
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

# Creates parents, doesn't error if exists
mkdir -p /var/cache/myapp/data
mkdir -p /tmp/build

# Set explicit permissions (only on newly created dirs)
mkdir -p "$CONFIG_DIR"
chmod 700 "$CONFIG_DIR"

# Create with specific mode in one step
mkdir -p -m 0700 "$SECURE_DIR"

# Create multiple directories at once
mkdir -p \
    "${BUILD_DIR}/bin" \
    "${BUILD_DIR}/lib" \
    "${BUILD_DIR}/tmp" \
    "${BUILD_DIR}/logs"
```

## Note: Permissions with -p

```bash
# mkdir -p only sets mode on the final directory
mkdir -p -m 755 /a/b/c
# Only /a/b/c gets mode 755; /a and /a/b get umask defaults

# If you need specific permissions on all created directories:
mkdir -p /a/b/c
chmod 755 /a /a/b /a/b/c   # Or use: find /a -type d -exec chmod 755 {} \;
```

## See Also

- [io-tempfile-safely](./io-tempfile-safely.md) - Creating temp directories
- [err-no-unchecked-cd](./err-no-unchecked-cd.md) - cd error handling
