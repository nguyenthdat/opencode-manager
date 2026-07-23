# err-dry-run-pattern

> Support `--dry-run` in destructive scripts

## Why It Matters

Scripts that modify files, delete data, or change system state should be safe to test. A `--dry-run` flag lets users see what the script *would* do without actually doing it, preventing costly mistakes. This is standard practice for deployment scripts, data migrations, and system administration tools.

## Bad

```bash
#!/usr/bin/env bash
set -euo pipefail

# No dry-run — users must trust or risk it
cleanup_old_logs() {
    find /var/log -name "*.log" -mtime +30 -delete
}

migrate_data() {
    for file in data/*.csv; do
        transform "$file" > "processed/${file##*/}"
        rm "$file"    # Destructive, no way to preview
    done
}

cleanup_old_logs
migrate_data
```

## Good

```bash
#!/usr/bin/env bash
set -euo pipefail

DRY_RUN=false

usage() {
    echo "Usage: $0 [--dry-run]" >&2
    exit 2
}

while (($# > 0)); do
    case "$1" in
        --dry-run) DRY_RUN=true; shift ;;
        -h|--help) usage ;;
        *) echo "Unknown option: $1" >&2; usage ;;
    esac
done

run_cmd() {
    if "$DRY_RUN"; then
        echo "[DRY RUN] Would run: $*" >&2
    else
        "$@"
    fi
}

cleanup_old_logs() {
    if "$DRY_RUN"; then
        echo "[DRY RUN] Would delete:"
        find /var/log -name "*.log" -mtime +30 -print
    else
        find /var/log -name "*.log" -mtime +30 -delete
    fi
}

migrate_data() {
    for file in data/*.csv; do
        if "$DRY_RUN"; then
            echo "[DRY RUN] Would transform $file -> processed/${file##*/}"
            echo "[DRY RUN] Would remove $file"
        else
            transform "$file" > "processed/${file##*/}"
            rm "$file"
        fi
    done
}

if "$DRY_RUN"; then
    echo "=== DRY RUN MODE — no changes will be made ===" >&2
fi

cleanup_old_logs
migrate_data
```

## See Also

- [fn-option-parsing](./fn-option-parsing.md) - Using getopts for arguments
- [fn-usage-help](./fn-usage-help.md) - Usage help functions
