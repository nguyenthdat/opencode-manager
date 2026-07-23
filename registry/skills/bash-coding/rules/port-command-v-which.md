# port-command-v-which

> Use `command -v` over `which` for command checking

## Why It Matters

`which` is an external command (not a shell builtin) with inconsistent behavior across systems: some versions search only PATH, others include builtins; exit codes vary; output format differs. `command -v` is a POSIX-mandated shell builtin that works identically everywhere, handles functions/aliases/builtins, and provides a machine-readable exit code.

## Bad

```bash
#!/bin/sh
# which is external, inconsistent, and non-standard output

if which python3 >/dev/null; then    # Works but not POSIX
    echo "Python found"
fi

# which may print aliases, may not set exit code correctly
python_path="$(which python3)"        # "/usr/bin/python3" or "python3: aliased to ..."?
```

## Good

```bash
#!/bin/sh
# command -v: POSIX, builtin, consistent

if command -v python3 >/dev/null 2>&1; then
    echo "Python found"
fi

# Get path (POSIX-compatible)
python_path="$(command -v python3)"

# Check multiple commands
check_deps() {
    local missing=0
    for cmd in "$@"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            echo "Missing: ${cmd}" >&2
            missing=1
        fi
    done
    return "$missing"
}
```

## Comparison

| Tool | POSIX | Builtin | Shows aliases | Consistent exit code |
|------|-------|---------|--------------|---------------------|
| `command -v` | Yes | Yes | Yes | Yes |
| `which` | No | No | Varies | Varies |
| `type` | No | Yes | Yes | Yes (Bash-specific) |
| `hash` | No | Yes | No | Yes (Bash-specific) |

## See Also

- [err-command-exists](./err-command-exists.md) - Checking command availability
- [port-avoid-bashisms](./port-avoid-bashisms.md) - POSIX compatibility
