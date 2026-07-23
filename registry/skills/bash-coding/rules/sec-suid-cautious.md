# sec-suid-cautious

> Avoid setuid shell scripts; use `sudo` instead

## Why It Matters

Setuid shell scripts are disabled on most modern Unix systems (including Linux), and for good reason: shell scripts have a massive attack surface. Environment variables like `IFS`, `PATH`, `LD_PRELOAD`, and `LD_LIBRARY_PATH` can be manipulated before the script runs, allowing privilege escalation. Use `sudo` with a restricted configuration instead.

## Bad

```bash
#!/bin/bash
# Attempting to use setuid — this won't work on Linux
# chown root:root script.sh && chmod 4755 script.sh
# Linux ignores setuid bit on scripts!

# Running privileged operations without sudo
mount /dev/sda1 /mnt      # Requires root; will fail for normal users
systemctl restart nginx    # Requires root
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

# Script runs as normal user; uses sudo for privileged operations
require_sudo() {
    if ! sudo -n true 2>/dev/null; then
        echo "This script requires sudo access for privileged operations." >&2
        echo "Please enter your password when prompted." >&2
    fi
}

# Check for specific sudo permissions
check_sudo_perm() {
    if ! sudo -l "$@" &>/dev/null; then
        echo "ERROR: Missing sudo permission: $*" >&2
        exit 1
    fi
}

require_sudo
sudo mount /dev/sda1 /mnt
sudo systemctl restart nginx

# For specific commands, write a sudoers entry:
# /etc/sudoers.d/myapp:
#   %deployers ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx
```

## Sudoers Best Practice

```bash
# /etc/sudoers.d/myapp — tight restrictions
# Format: user host=(runas) [NOPASSWD:] commands

%deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart myapp
%deploy ALL=(root) NOPASSWD: /usr/bin/systemctl status myapp
# NOT: %deploy ALL=(ALL) NOPASSWD: ALL  <-- never do this

# Validate sudoers before deploying
sudo visudo -c -f /etc/sudoers.d/myapp
```

## See Also

- [sec-path-injection](./sec-path-injection.md) - PATH manipulation risks
- [sec-umask-restrictive](./sec-umask-restrictive.md) - Restrictive umask for sensitive data
