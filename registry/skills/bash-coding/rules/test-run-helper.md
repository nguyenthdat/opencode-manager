# test-run-helper

> Use Bats `run` helper to capture output and status

## Why It Matters

The `run` helper is the cornerstone of Bats testing. It executes a command and captures its exit status (`$status`) and combined stdout+stderr output (`$output`), plus separated output streams (`$lines` array). Without `run`, you'd need to manually redirect and capture, which is error-prone. `run` also ensures `set -e` doesn't abort the test on expected failures.

## Bad

```bash
@test "check command output" {
    # Manual capture — verbose, fragile
    output="$(my_command 2>&1)"
    status=$?
    [ "$status" -eq 0 ]
    [ "$output" = "expected" ]
}

@test "check failure" {
    # set -e would abort here — need workaround
    set +e
    output="$(failing_command 2>&1)"
    status=$?
    set -e
    [ "$status" -ne 0 ]
}
```

## Good

```bash
@test "successful command" {
    run my_command "arg1" "arg2"
    [ "$status" -eq 0 ]
    [ "$output" = "expected" ]
}

@test "failing command" {
    run failing_command "bad_arg"
    [ "$status" -eq 1 ]
    [[ "$output" == *"error"* ]]
}

@test "check specific output lines" {
    run ls -1
    [ "$status" -eq 0 ]
    [ "${lines[0]}" = "file1.txt" ]
    [ "${lines[1]}" = "file2.txt" ]
    [ "${#lines[@]}" -eq 2 ]
}

@test "check stderr and stdout separately" {
    run my_command 2>&1   # Captures both
    # Or:
    run my_command
    # $output contains stdout only (stderr not captured by default)
}
```

## `run` Variables

| Variable | Content |
|----------|---------|
| `$status` | Exit code of the command |
| `$output` | Combined stdout + stderr |
| `${lines[0]}` | First line of output |
| `${lines[1]}` | Second line of output |
| `${#lines[@]}` | Total number of output lines |

## See Also

- [test-bats-framework](./test-bats-framework.md) - Bats framework overview
- [test-assert-output](./test-assert-output.md) - Assertion patterns
