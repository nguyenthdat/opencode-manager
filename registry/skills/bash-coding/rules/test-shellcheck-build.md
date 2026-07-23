# test-shellcheck-build

> Run ShellCheck as part of the test suite

## Why It Matters

ShellCheck static analysis catches dozens of common bugs before they reach production. Integrating ShellCheck into your test suite treats linting violations as test failures, ensuring code quality gates are enforced automatically in CI. This prevents lint regressions and catches issues early in the development cycle.

## Bad

```bash
# ShellCheck only run manually (or never)
# Linting errors discovered in production

# In CI:
shellcheck myscript.sh || true    # Ignored!
```

## Good

```bash
#!/usr/bin/env bats

@test "scripts pass shellcheck" {
    if ! command -v shellcheck &>/dev/null; then
        skip "shellcheck not installed"
    fi
    run shellcheck --severity=error myscript.sh
    [ "$status" -eq 0 ]
}

@test "all library scripts pass shellcheck" {
    if ! command -v shellcheck &>/dev/null; then
        skip "shellcheck not installed"
    fi
    local fail=0
    for script in lib/*.sh; do
        run shellcheck --severity=warning "$script"
        if [ "$status" -ne 0 ]; then
            echo "${script}: ${output}" >&2
            fail=1
        fi
    done
    [ "$fail" -eq 0 ]
}
```

## ShellCheck CI Script

```bash
#!/usr/bin/env bash
# lint.sh — run in CI
set -euo pipefail

if ! command -v shellcheck &>/dev/null; then
    echo "Installing shellcheck..."
    # brew install shellcheck  # macOS
    # apt-get install shellcheck  # Debian/Ubuntu
    exit 1
fi

echo "Running ShellCheck..."
declare -i errors=0

while IFS= read -r -d '' script; do
    echo "  Checking: ${script}"
    shellcheck --severity=warning "$script" || ((errors++))
done < <(find . -name "*.sh" -o -name "*.bash" -print0)

if ((errors > 0)); then
    echo "ShellCheck found errors in ${errors} script(s)" >&2
    exit 1
fi
echo "All scripts pass ShellCheck"
```

## See Also

- [sec-shellcheck-required](./sec-shellcheck-required.md) - Using ShellCheck
- [test-ci-integration](./test-ci-integration.md) - CI integration
