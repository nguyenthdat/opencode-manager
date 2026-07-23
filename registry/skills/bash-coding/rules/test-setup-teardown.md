# test-setup-teardown

> Use `setup()` and `teardown()` for test fixtures

## Why It Matters

Bats provides `setup()` and `teardown()` hooks that run before and after each `@test`, ensuring test isolation and repeatable state. Without these, tests share state (files, directories, environment variables), leading to order-dependent failures. `setup()` creates fixtures; `teardown()` cleans them up even if the test fails.

## Bad

```bash
# No setup/teardown — tests interfere with each other
@test "creates a file" {
    touch /tmp/test_file
    [ -f /tmp/test_file ]
}

@test "counts files" {
    # /tmp/test_file from previous test still exists!
    touch /tmp/test_another
    count=$(ls /tmp/test_* | wc -l)
    [ "$count" -eq 1 ]    # Fails! count is 2
}
```

## Good

```bash
setup() {
    TEST_DIR="$(mktemp -d)"
    cd "$TEST_DIR"
    export APP_CONFIG="${TEST_DIR}/config"
    echo "default" > "$APP_CONFIG"
}

teardown() {
    rm -rf "$TEST_DIR"
}

@test "creates a file" {
    touch myfile.txt
    [ -f myfile.txt ]
}

@test "counts files" {
    # Clean state — no files from other tests
    touch file1.txt file2.txt
    count=$(find . -maxdepth 1 -type f | wc -l)
    [ "$count" -eq 2 ]
}

@test "reads config" {
    echo "production" > "$APP_CONFIG"
    run get_config_value
    [ "$output" = "production" ]
}
```

## Setup/Teardown Best Practices

```bash
setup() {
    # Create temp directories
    TEST_DIR="$(mktemp -d)"
    cd "$TEST_DIR"

    # Save and reset environment
    OLD_HOME="$HOME"
    export HOME="$TEST_DIR"

    # Source the script under test
    SCRIPT_DIR="$(cd "$(dirname "${BATS_TEST_FILENAME}")/.." && pwd)"
    load "${SCRIPT_DIR}/script.sh"
}

teardown() {
    # Restore environment
    export HOME="$OLD_HOME"

    # Clean temp files
    rm -rf "$TEST_DIR"

    # Always use : as fallback in case vars are unset
    rm -rf "${TEMP_DATA:-}" "${LOCK_FILE:-}"
}
```

## See Also

- [test-bats-framework](./test-bats-framework.md) - Bats framework
- [test-temp-dirs](./test-temp-dirs.md) - Test temp directories
