# name-files-kebab-case

> Use `kebab-case.sh` for script file names

## Why It Matters

Consistent file naming makes scripts discoverable and maintainable. `kebab-case` (lowercase with hyphens) is the Unix convention for executable files: easy to type, no need for Shift or quoting, and works on all filesystems. Avoid spaces (require quoting), underscores (harder to type), and mixed case (ambiguous on case-insensitive filesystems).

## Bad

```bash
# Spaces require quoting — annoying
"My Script.sh"
"deploy to production.sh"

# Mixed case — ambiguous on macOS (case-insensitive)
ProcessData.sh
processdata.sh   # Different file? Or same on macOS?

# Inconsistent conventions
data-processor.sh
data_processor   # No extension
DataProcessor.bash

# No extension — is it bash? python? binary?
backup-script
```

## Good

```bash
# kebab-case with .sh extension
deploy-to-production.sh
process-data.sh
backup-database.sh
run-tests.sh

# Consistent extension
setup-environment.sh
validate-config.sh
rotate-logs.sh

# Library files (sourced, not executed)
# lib-logging.sh — prefix with lib-
# common-utils.sh
```

## Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| Executable scripts | `kebab-case.sh` | `deploy-app.sh`, `run-backup.sh` |
| Library files | `lib-name.sh` | `lib-logging.sh`, `lib-config.sh` |
| Configuration | `*.conf`, `.env` | `app.conf`, `.env.production` |
| Tests | `test_*.bats` | `test_deploy.bats` |

## See Also

- [fn-library-source](./fn-library-source.md) - Creating reusable libraries
- [name-library-prefix](./name-library-prefix.md) - Library naming patterns
