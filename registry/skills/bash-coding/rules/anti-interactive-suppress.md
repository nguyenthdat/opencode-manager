# anti-interactive-suppress

> Don't use `yes |` in scripts; handle interaction properly

## Why It Matters

`yes | command` pipes "y\\n" to a command's stdin, blindly answering "yes" to every prompt — including "Are you sure you want to delete all data?" and "This will overwrite the production database. Continue?" It suppresses critical safety prompts. Instead, use the command's own force flags (`-f`, `--yes`, `--force`) or properly automate the interaction with `expect` or explicit stdin.

## Bad

```bash
# Blindly saying yes to everything — dangerous!
yes | rm -r /important/data
yes | mysql -u root -e "DROP DATABASE production"
yes | ssh server "dangerous-command"

# Piping through yes to suppress prompts in scripts
yes | fsck /dev/sda1   # May "fix" things you didn't want fixed
yes | apt-get remove    # Uninstalls dependencies you might need
```

## Good

```bash
# Use the command's own force/confirm flags
rm -rf /path/to/clean     # -f: force, no prompt
mysql -u root -e "DROP DATABASE IF EXISTS production"

# Use --yes, --force, --non-interactive flags
apt-get remove -y package-name
ssh -o StrictHostKeyChecking=no server "command"

# Explicit confirmation script with safeguards
confirm_action() {
    local message="$1"
    local response
    read -r -p "${message} [y/N]: " response
    [[ "$response" =~ ^[Yy]$ ]] || return 1
}

if confirm_action "Delete all build artifacts?"; then
    rm -rf ./build/*
fi
```

## See Also

- [err-dry-run-pattern](./err-dry-run-pattern.md) - Dry run instead of blind execution
- [sec-sanitize-input](./sec-sanitize-input.md) - Input validation
