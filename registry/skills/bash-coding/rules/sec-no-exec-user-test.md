# sec-no-exec-user-test

> Don't use user input in command names

## Why It Matters

When a script uses user input as part of a command name, an attacker can specify any executable on the system. Even with PATH controls, builtins and system binaries are available. This is a direct command execution vulnerability. Always whitelist allowed commands or use structured dispatch (case/if chains) instead.

## Bad

```bash
# User controls the command — arbitrary execution
action="$1"
"$action" "$filename"                    # User passes "rm -rf /" or "reboot"

# User controls tool selection
"$EDITOR" "$file"                        # EDITOR="/bin/evil" => owned

# User controls interpreter
"$SHELL" -c "$user_script"               # SHELL="/bin/malicious"

# User-provided prefix
"${tool_prefix}-helper" --process data   # tool_prefix="echo ; rm -rf / ; # "
```

## Good

```bash
# Whitelist with case dispatch
action="$1"
case "$action" in
    compress|decompress|verify|list)
        ;;
    *)
        echo "ERROR: Unknown action: ${action}" >&2
        echo "Valid actions: compress, decompress, verify, list" >&2
        exit 1
        ;;
esac

# Function dispatch table (Bash)
declare -A ACTIONS=(
    [compress]=compress_files
    [decompress]=decompress_files
    [verify]=verify_archive
    [list]=list_contents
)

if [[ -n "${ACTIONS[$action]:-}" ]]; then
    "${ACTIONS[$action]}" "$filename"
else
    echo "Unknown action: $action" >&2
    exit 1
fi

# Don't trust EDITOR directly; whitelist
case "${EDITOR:-}" in
    */vim|*/nano|*/emacs|*/vi)
        "$EDITOR" "$file"
        ;;
    *)
        echo "Unsupported editor: ${EDITOR}" >&2
        /usr/bin/vim "$file"
        ;;
esac
```

## See Also

- [sec-sanitize-input](./sec-sanitize-input.md) - Input validation techniques
- [fn-option-parsing](./fn-option-parsing.md) - Using getopts
