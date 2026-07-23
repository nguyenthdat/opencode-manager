# io-tempfile-safely

> Use `mktemp` for temporary files; never hardcode `/tmp`

## Why It Matters

Hardcoding temporary file paths like `/tmp/myscript.tmp` creates predictable filenames vulnerable to symlink attacks (TOCTOU — Time Of Check, Time Of Use). Multiple concurrent script runs collide. `mktemp` generates unique, unpredictable filenames with secure permissions, eliminating these risks entirely. Never write to `/tmp` without it.

## Bad

```bash
# Predictable filename — symlink attack risk
TMPFILE="/tmp/myscript.$$"
echo "$data" > "$TMPFILE"   # Attacker could symlink to /etc/passwd

# Collision with concurrent runs
TMPDIR="/tmp/build"
mkdir "$TMPDIR"              # Fails if another instance already created it
rm -rf "$TMPDIR"/*           # Deletes another script's files!

# World-readable temp files
TMPFILE="/tmp/data.txt"
process_data > "$TMPFILE"    # Other users can read sensitive data
```

## Good

```bash
# Create temp file with mktemp
TMPFILE="$(mktemp)"                      # /tmp/tmp.XXXXXXXXXX
echo "$data" > "$TMPFILE"

# Specify a meaningful suffix
TMPFILE="$(mktemp --suffix .json)"       # /tmp/tmp.XXXX.json

# Create temp directory
TMPDIR="$(mktemp -d)"                    # /tmp/tmp.XXXXXXXXXX
process_data > "$TMPDIR/result.txt"

# Custom prefix and location
TMPFILE="$(mktemp /var/tmp/myapp.XXXXXX)"

# Cleanup with trap
cleanup() {
    rm -rf "${TMPDIR:-}" "${TMPFILE:-}"
}
trap cleanup EXIT

TMPDIR="$(mktemp -d)"
TMPFILE="$(mktemp)"
# ... work ...
# cleanup runs automatically on exit
```

## mktemp Options

```bash
mktemp                # Create file in /tmp
mktemp -d             # Create directory in /tmp
mktemp -p /var/tmp    # Use specific directory
mktemp --suffix .txt  # Add suffix
mktemp --tmpdir myapp.XXXX  # Custom template (POSIX)
mktemp -t myapp               # macOS / older systems
```

## See Also

- [sec-tempfile-race](./sec-tempfile-race.md) - TOCTOU race conditions
- [err-trap-exit-cleanup](./err-trap-exit-cleanup.md) - Auto-cleanup with trap
