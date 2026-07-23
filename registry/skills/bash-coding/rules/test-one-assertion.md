# test-one-assertion

> Test one behavior per test case

## Why It Matters

Tests that assert multiple behaviors are hard to debug — when the test fails, you don't know which assertion broke. Single-assertion tests (one logical behavior per `@test`) fail with clear, specific messages and serve as documentation of exactly what the code should do. The test name tells you what broke instantly.

## Bad

```bash
@test "process_file works" {
    run process_file "input.txt"
    [ "$status" -eq 0 ]
    [ -f "output.txt" ]
    [ "$(wc -l < output.txt)" -eq 10 ]
    [[ "$(head -1 output.txt)" == "Header"* ]]
    [[ "$(tail -1 output.txt)" == *"Footer" ]]
    [ -f "metadata.json" ]
    [ "$(jq '.version' metadata.json)" = '"1.0"' ]
    # Which one failed? Who knows!
}
```

## Good

```bash
@test "process_file succeeds with valid input" {
    run process_file "input.txt"
    [ "$status" -eq 0 ]
}

@test "process_file creates output file" {
    run process_file "input.txt"
    [ -f "output.txt" ]
}

@test "process_file produces correct number of lines" {
    run process_file "input.txt"
    [ "$(wc -l < output.txt)" -eq 10 ]
}

@test "process_file output has header" {
    run process_file "input.txt"
    [[ "$(head -1 output.txt)" == "Header"* ]]
}

@test "process_file output has footer" {
    run process_file "input.txt"
    [[ "$(tail -1 output.txt)" == *"Footer" ]]
}

@test "process_file creates metadata with version" {
    run process_file "input.txt"
    [ -f "metadata.json" ]
    [ "$(jq '.version' metadata.json)" = '"1.0"' ]
}
```

## Test Naming Convention

```bash
# Pattern: "subject does_what under_what_condition"
@test "parse_config fails on missing file" { :; }
@test "parse_config returns defaults when file is empty" { :; }
@test "parse_config overrides defaults with file values" { :; }
@test "parse_config rejects invalid YAML" { :; }
```

## See Also

- [test-assert-output](./test-assert-output.md) - Assertion patterns
- [test-bats-framework](./test-bats-framework.md) - Bats framework
