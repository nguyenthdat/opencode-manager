# test-assert-output

> Use `[ "$output" = "expected" ]` and `[ "$status" -eq 0 ]`

## Why It Matters

Bats tests use standard Bash test constructs (`[ ]`, `[[ ]]`) for assertions — there's no magic assertion library. The pattern `run command; [ "$status" -eq 0 ]; [ "$output" = "expected" ]` is the idiomatic way to verify both that a command succeeded and produced the correct output. Understanding this pattern is essential for writing effective Bats tests.

## Bad

```bash
@test "check command" {
    # No status check — hides failures
    output="$(my_command)"
    [ "$output" = "expected" ]    # What if my_command crashes?
}

@test "confusing assertions" {
    run my_command
    # Wrong: checks status without checking output
    [ "$status" -eq 0 ]

    # Wrong: checks neither
    [[ "$output" =~ pattern ]]
}
```

## Good

```bash
@test "command succeeds with correct output" {
    run my_command "input"
    [ "$status" -eq 0 ]
    [ "$output" = "expected output" ]
}

@test "command fails with error message" {
    run my_command "bad_input"
    [ "$status" -eq 1 ]
    [[ "$output" == *"Invalid input"* ]]
}

@test "command produces multi-line output" {
    run generate_report
    [ "$status" -eq 0 ]
    [ "${lines[0]}" = "Report Header" ]
    [ "${lines[1]}" = "==============" ]
    [[ "${lines[2]}" == "Total: "* ]]
}

@test "output matches regex" {
    run get_version
    [ "$status" -eq 0 ]
    [[ "$output" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]
}

@test "command is silent on success" {
    run silent_command
    [ "$status" -eq 0 ]
    [ -z "$output" ]
}
```

## Common Assertion Patterns

```bash
# Exact output
[ "$output" = "exact match" ]

# Substring check
[[ "$output" == *"substring"* ]]

# Regex match
[[ "$output" =~ ^pattern.*$ ]]

# Output length
[ "${#output}" -gt 10 ]

# Line count
[ "${#lines[@]}" -eq 5 ]

# Specific line
[ "${lines[2]}" = "third line" ]

# Empty output
[ -z "$output" ]
```

## See Also

- [test-run-helper](./test-run-helper.md) - The run helper
- [test-one-assertion](./test-one-assertion.md) - One assertion per test
