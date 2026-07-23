# test-error-union-expect

> Use `std.testing.expectError` to assert that a specific error is returned

## Why It Matters

Testing failure paths matters as much as testing success paths, and `expectError(expected_error, actual_result)` checks both that the call failed *and* that it failed with the specific error you expect — a bare `try` on a call expected to fail would instead make the test itself fail with an unhandled error, which is exactly backwards.

## Bad

```zig
const std = @import("std");

test "rejects a negative port" {
    // `try` here means the test fails with a propagated error the instant
    // parsePort returns an error — never actually verifying that failure
    // was the *expected*, specific outcome.
    const port = try parsePort("-1");
    _ = port;
}

fn parsePort(input: []const u8) !u16 {
    if (input[0] == '-') return error.InvalidPort;
    return std.fmt.parseInt(u16, input, 10);
}
```

## Good

```zig
const std = @import("std");

test "rejects a negative port" {
    try std.testing.expectError(error.InvalidPort, parsePort("-1"));
}

test "accepts a valid port" {
    try std.testing.expectEqual(@as(u16, 8080), try parsePort("8080"));
}

fn parsePort(input: []const u8) !u16 {
    if (input[0] == '-') return error.InvalidPort;
    return std.fmt.parseInt(u16, input, 10);
}
```

## See Also

- [test-std-testing-expect](test-std-testing-expect.md) - the general-purpose assertion helpers this complements
- [err-error-set-explicit](err-error-set-explicit.md) - naming the errors these tests check for
- [test-table-driven](test-table-driven.md) - testing many invalid inputs against `expectError` at once
