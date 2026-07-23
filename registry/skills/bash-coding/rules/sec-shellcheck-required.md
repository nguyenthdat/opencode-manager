# sec-shellcheck-required

> Run `shellcheck` on all shell scripts

## Why It Matters

ShellCheck is a static analysis tool that catches hundreds of common shell scripting errors: unquoted variables, incorrect test syntax, `set -e` edge cases, subshell pitfalls, and security vulnerabilities. It's the shell equivalent of a linter + compiler warnings combined. Running ShellCheck in CI/CD ensures these issues are caught before deployment.

## Bad

```bash
#!/usr/bin/env bash
# No shellcheck directive, no linting in CI

files=$(ls *.txt)
for f in $files; do          # SC2045: for loops over ls output
    if [ $f = "important.txt" ]; then  # SC2086: unquoted variable
        cat $f | grep error   # SC2002: useless use of cat
    fi
done
```

## Good

```bash
#!/usr/bin/env bash
# shellcheck shell=bash
# shellcheck disable=SC2034  # VAR appears unused (but is used by eval)

set -euo pipefail

# All shellcheck warnings resolved
shopt -s nullglob
declare -a files=(*.txt)
for f in "${files[@]}"; do
    if [[ "$f" == "important.txt" ]]; then
        grep "error" "$f"
    fi
done
```

## ShellCheck CI Integration

```bash
# In CI pipeline
shellcheck myscript.sh
shellcheck --severity=error myscript.sh   # Strict mode
shellcheck --format=json myscript.sh      # Machine-readable output

# Check all scripts in project
find . -name "*.sh" -o -name "*.bash" | while IFS= read -r f; do
    shellcheck "$f"
done

# Ignore specific checks with directive
# shellcheck disable=SC1090  # Can't follow non-constant source
source "${HOME}/.config"

# .shellcheckrc — project-wide settings
# disable=SC1090,SC1091
# source-path=SCRIPTDIR
```

## Common ShellCheck Codes

| Code | Issue |
|------|-------|
| SC2086 | Unquoted variable |
| SC2046 | Unquoted $(...) in argument |
| SC2068 | Missing quotes on array expansion |
| SC2164 | cd without check |
| SC2155 | declare and assign separately |
| SC2207 | Missing readarray for array assignment |
| SC2002 | Useless use of cat |
| SC1091 | Not following source |

## See Also

- [test-shellcheck-build](./test-shellcheck-build.md) - ShellCheck in test suite
- [var-always-quote](./var-always-quote.md) - The quoting rule ShellCheck enforces
