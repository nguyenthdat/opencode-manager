# test-temp-dirs

> Create and clean test directories in setup/teardown

## Why It Matters

Tests that operate on real files risk data loss, pollute the filesystem, and interfere with each other. Using `mktemp -d` in `setup()` creates an isolated temporary directory for each test, and `teardown()` removes it. This ensures tests are idempotent, parallelizable, and safe — a failed test never leaves junk behind.

## Bad

```bash
# Working in real directories — dangerous
@test "creates config file" {
    run generate_config /etc/myapp
    # Actually writes to /etc/myapp!
}

@test "cleans temp files" {
    run cleanup_temp /tmp
    # What else is in /tmp?!

    # Manual cleanup — if test fails, cleanup never runs
    rm /tmp/test_file
}
```

## Good

```bash
setup() {
    TEST_DIR="$(mktemp -d)"
    cd "$TEST_DIR"
    export HOME="$TEST_DIR"
    export XDG_CONFIG_HOME="${TEST_DIR}/.config"
}

teardown() {
    # Clean even if test fails
    rm -rf "$TEST_DIR"
}

@test "creates config file" {
    run generate_config
    [ "$status" -eq 0 ]
    [ -f "${XDG_CONFIG_HOME}/myapp/config.yml" ]
}

@test "processes files in directory" {
    mkdir -p input output
    echo "data" > input/file.txt
    run process_directory input output
    [ "$status" -eq 0 ]
    [ -f output/file.txt ]
    [ "$(cat output/file.txt)" = "processed: data" ]
}
```

## Temp Dir Best Practices

```bash
setup() {
    # Use mktemp for guaranteed uniqueness
    TEST_DIR="$(mktemp -d)" || exit 1

    # Subdirectories mirror real structure
    mkdir -p "${TEST_DIR}/"{input,output,tmp,logs}

    # Set up minimal filesystem state
    echo "default" > "${TEST_DIR}/config"
    export APP_CONFIG="${TEST_DIR}/config"

    # Change to test dir so relative paths work
    cd "$TEST_DIR"
}

teardown() {
    rm -rf "${TEST_DIR:-}"    # :- guard against unset
}
```

## See Also

- [test-setup-teardown](./test-setup-teardown.md) - Setup/teardown pattern
- [io-tempfile-safely](./io-tempfile-safely.md) - Using mktemp
