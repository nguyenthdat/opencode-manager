# sec-umask-restrictive

> Set `umask 077` for scripts handling sensitive data

## Why It Matters

The default `umask` (commonly `022` or `002`) allows other users to read newly created files. Scripts that handle passwords, API keys, certificates, or personal data should create files with restricted permissions. Setting a restrictive `umask` at the top of the script ensures all created files are private by default.

## Bad

```bash
#!/usr/bin/env bash
# Default umask (022) — files are world-readable
# -rw-r--r-- 1 user group 1234 config.yaml

# Credentials saved to world-readable files
echo "password: $DB_PASS" > db_config.yaml       # -rw-r--r--
curl -o /tmp/response.json "$API_URL"             # -rw-r--r--

# Temp files created with default permissions
TMPFILE="$(mktemp)"                               # 600 (mktemp does this right)
# But explicitly created files are exposed
echo "$TOKEN" > "$HOME/token.txt"                 # -rw-r--r--
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

# Restrict file creation to current user only
umask 077
# All created files will be 600, directories 700

# Sensitive data files are private by default
echo "password: $DB_PASS" > db_config.yaml       # -rw-------
curl -o /tmp/response.json "$API_URL"             # -rw-------

# Script-specific cache directory
CACHE_DIR="${HOME}/.cache/myscript"
mkdir -p -m 0700 "$CACHE_DIR"                    # Explicit mode

# Relax umask only when needed
umask 077   # Default: restrictive
# ... sensitive work ...

(
    umask 022   # Subshell: don't propagate
    install -m 644 public_file.txt /usr/share/
)

# Save and restore umask
old_umask="$(umask)"
umask 077
# ... sensitive work ...
umask "$old_umask"
```

## Umask Values

| umask | File permissions | Directory permissions |
|-------|-----------------|----------------------|
| 077 | 600 (rw-------) | 700 (rwx------) |
| 027 | 640 (rw-r-----) | 750 (rwxr-x---) |
| 022 | 644 (rw-r--r--) | 755 (rwxr-xr-x) |
| 002 | 664 (rw-rw-r--) | 775 (rwxrwxr-x) |

## See Also

- [sec-no-hardcoded-secrets](./sec-no-hardcoded-secrets.md) - Secret management
- [io-tempfile-safely](./io-tempfile-safely.md) - Safe temp file creation
