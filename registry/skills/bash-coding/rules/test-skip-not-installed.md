# test-skip-not-installed

> Skip tests when dependencies not installed

## Why It Matters

Not all test environments have every optional dependency installed (e.g., `jq`, `docker`, `postgres`). Running tests that depend on missing tools produces confusing failures unrelated to the code under test. Using Bats' `skip` command with a clear message makes it obvious why a test didn't run and avoids false negatives.

## Bad

```bash
@test "docker build works" {
    # Fails on systems without Docker with "command not found"
    run docker build -t test .
    [ "$status" -eq 0 ]
}

@test "postgres connection" {
    # Fails immediately if psql not installed
    run psql -c "SELECT 1"
    [ "$status" -eq 0 ]
}
```

## Good

```bash
@test "docker build works" {
    if ! command -v docker &>/dev/null; then
        skip "Docker is not installed"
    fi
    run docker build -t test .
    [ "$status" -eq 0 ]
}

@test "postgres connection" {
    if ! command -v psql &>/dev/null; then
        skip "psql is not installed"
    fi
    run psql -c "SELECT 1"
    [ "$status" -eq 0 ]
}

# Helper function
require_cmd() {
    local cmd="$1"
    if ! command -v "$cmd" &>/dev/null; then
        skip "${cmd} is not installed"
    fi
}

@test "jq processes JSON" {
    require_cmd "jq"
    run jq '.version' package.json
    [ "$status" -eq 0 ]
}

# Skip based on environment
@test "production-only behavior" {
    if [[ "${APP_ENV:-}" != "production" ]]; then
        skip "Test requires APP_ENV=production"
    fi
    run check_production_config
    [ "$status" -eq 0 ]
}
```

## See Also

- [test-bats-framework](./test-bats-framework.md) - Bats framework
- [err-command-exists](./err-command-exists.md) - Checking command availability
