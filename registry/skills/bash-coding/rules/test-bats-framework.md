# test-bats-framework

> Use Bats (Bash Automated Testing System) for testing

## Why It Matters

Shell scripts have a well-deserved reputation for being hard to test. Bats provides a TAP-compliant (Test Anything Protocol) testing framework specifically designed for Bash scripts. It handles setup/teardown, provides `run` for capturing output and status, and integrates with CI/CD pipelines. Without a framework, shell testing is ad-hoc and unreliable.

## Bad

```bash
# Ad-hoc testing — no structure, hard to run
#!/usr/bin/env bash

# Manual test
result="$(my_function "arg1")"
if [ "$result" = "expected" ]; then
    echo "PASS: my_function works"
else
    echo "FAIL: Expected 'expected', got '$result'"
fi

# No isolation between tests
# No teardown, no reporting, no CI integration
```

## Good

```bash
#!/usr/bin/env bats
# test_myapp.bats

setup() {
    # Runs before each test
    TEST_DIR="$(mktemp -d)"
    cd "$TEST_DIR"
}

teardown() {
    # Runs after each test
    rm -rf "$TEST_DIR"
}

@test "my_function returns expected output" {
    run my_function "arg1"
    [ "$status" -eq 0 ]
    [ "$output" = "expected" ]
}

@test "my_function fails on empty input" {
    run my_function ""
    [ "$status" -eq 1 ]
    [[ "$output" == *"empty"* ]]
}

@test "my_function writes to specified file" {
    run my_function --output result.txt "data"
    [ "$status" -eq 0 ]
    [ -f "result.txt" ]
    [ "$(cat result.txt)" = "processed: data" ]
}
```

## Running Bats Tests

```bash
# Install
npm install -g bats    # Or: brew install bats-core

# Run tests
bats test_myapp.bats

# Run with TAP output (CI)
bats --formatter tap test_myapp.bats

# Run specific test by name
bats test_myapp.bats -f "returns expected output"

# Run in parallel (Bats 1.10+)
bats --jobs 4 test_*.bats
```

## See Also

- [test-run-helper](./test-run-helper.md) - Using the run helper
- [test-setup-teardown](./test-setup-teardown.md) - Setup and teardown fixtures
- [test-ci-integration](./test-ci-integration.md) - CI integration
