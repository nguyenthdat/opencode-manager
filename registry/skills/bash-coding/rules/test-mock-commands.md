# test-mock-commands

> Override functions or use stub scripts for mocking

## Why It Matters

Shell scripts often depend on external commands (`curl`, `git`, `docker`). Testing these scripts in isolation requires mocking those external dependencies so tests don't require network access, real credentials, or side effects. Overriding functions (simplest) or using stub scripts in a test-controlled PATH are the primary mocking strategies for shell scripts.

## Bad

```bash
# Test that actually calls external commands — slow, unreliable
@test "deploy pushes to registry" {
    run deploy_image "myapp" "v1.0"
    # Actually runs docker push! Requires Docker daemon, network...
    [ "$status" -eq 0 ]
}

# Test that modifies real files
@test "config is updated" {
    run update_config /etc/app/config.yml
    # Actually modifies system config!
}
```

## Good

```bash
# Override function in test
@test "deploy calls docker with correct args" {
    docker() {
        # Mock implementation
        if [[ "$1" == "push" ]]; then
            echo "pushed: $2"
            return 0
        fi
        command docker "$@"    # Delegate to real docker for other commands
    }

    run deploy_image "myapp" "v1.0"
    [ "$status" -eq 0 ]
    [[ "$output" == *"pushed"* ]]
}

# Stub script in test-controlled PATH
setup() {
    TEST_BIN="$(mktemp -d)"
    export PATH="${TEST_BIN}:${PATH}"

    # Create curl stub
    cat > "${TEST_BIN}/curl" <<'SCRIPT'
#!/usr/bin/env bash
echo '{"status": "ok"}'
exit 0
SCRIPT
    chmod +x "${TEST_BIN}/curl"

    # Create failing git stub
    cat > "${TEST_BIN}/git" <<'SCRIPT'
#!/usr/bin/env bash
echo "git: permission denied" >&2
exit 128
SCRIPT
    chmod +x "${TEST_BIN}/git"
}

teardown() {
    rm -rf "${TEST_BIN}"
}

@test "api call succeeds" {
    run fetch_data "https://api.example.com"
    [ "$status" -eq 0 ]
    [ "$output" = '{"status": "ok"}' ]
}
```

## See Also

- [test-setup-teardown](./test-setup-teardown.md) - Fixture management
- [fn-library-source](./fn-library-source.md) - Structuring for testability
