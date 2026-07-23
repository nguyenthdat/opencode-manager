# sec-tempfile-race

> Use `mktemp` to avoid TOCTOU races

## Why It Matters

Time-of-check-time-of-use (TOCTOU) races occur when an attacker can modify a file between the time you check it and the time you use it. Using predictable filenames in `/tmp` enables symlink attacks: an attacker creates a symlink from your expected filename to a sensitive file, and your script writes to it. `mktemp` creates unpredictable, unique filenames that attackers cannot anticipate.

## Bad

```bash
# Predictable temp file — TOCTOU race
TMPFILE="/tmp/myapp_$$.tmp"
if [ ! -f "$TMPFILE" ]; then
    echo "data" > "$TMPFILE"   # Attacker created a symlink between check and write!
fi
chmod 600 "$TMPFILE"           # Could chmod the target of a symlink

# Even $$ is predictable (PID, limited range)
TMPDIR="/tmp/my_script.${USER}"
mkdir -p "$TMPDIR"              # Attacker can pre-create this

# Lock file race
LOCK="/tmp/mylock"
if [ ! -f "$LOCK" ]; then
    touch "$LOCK"               # Another process created it between check and touch!
    critical_section
    rm "$LOCK"
fi
```

## Good

```bash
# mktemp prevents races
TMPFILE="$(mktemp)" || exit 1
echo "data" > "$TMPFILE"
chmod 600 "$TMPFILE"
# No TOCTOU: filename is unpredictable

# Temp directory
TMPDIR="$(mktemp -d)" || exit 1
process_data > "$TMPDIR/output"

# Directory-based locking (atomic)
LOCKDIR="/var/lock/myapp.lock"
if mkdir "$LOCKDIR" 2>/dev/null; then
    # mkdir is atomic — we got the lock
    trap 'rmdir "$LOCKDIR"' EXIT
    critical_section
else
    echo "Another instance is running" >&2
    exit 1
fi

# Cleanup with trap for safety
cleanup() { rm -rf "${TMPDIR:-}" "${TMPFILE:-}"; }
trap cleanup EXIT
```

## TOCTOU Explained

```bash
# Time 1: Check — file does not exist
if [ ! -f "/tmp/foo" ]; then
    # Attacker runs: ln -s /etc/passwd /tmp/foo
    # Time 2: Use — writes to symlink target
    echo "data" > "/tmp/foo"   # Oops, wrote to /etc/passwd
fi
```

## See Also

- [io-tempfile-safely](./io-tempfile-safely.md) - Using mktemp for temp files
- [err-trap-exit-cleanup](./err-trap-exit-cleanup.md) - Cleanup with traps
