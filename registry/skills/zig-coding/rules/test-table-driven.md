# test-table-driven

> Use an array of cases and a loop for testing many similar inputs, instead of copy-pasted near-identical tests

## Why It Matters

When a function has several input/output pairs that all exercise the same logic path (different valid inputs, different invalid inputs), a table of cases run through one loop keeps the test file short, makes adding a new case a one-line change, and avoids the drift risk of N copy-pasted test blocks that were supposed to stay identical except for their data.

## Bad

```zig
const std = @import("std");

test "parses 8080" {
    try std.testing.expectEqual(@as(u16, 8080), try parsePort("8080"));
}
test "parses 443" {
    try std.testing.expectEqual(@as(u16, 443), try parsePort("443"));
}
test "parses 22" {
    try std.testing.expectEqual(@as(u16, 22), try parsePort("22"));
}
// ... repeated for every case, with the only real difference being two literals.

fn parsePort(input: []const u8) !u16 {
    return std.fmt.parseInt(u16, input, 10);
}
```

## Good

```zig
const std = @import("std");

test "parsePort handles a range of valid ports" {
    const cases = [_]struct { input: []const u8, expected: u16 }{
        .{ .input = "8080", .expected = 8080 },
        .{ .input = "443", .expected = 443 },
        .{ .input = "22", .expected = 22 },
    };
    for (cases) |case| {
        const result = try parsePort(case.input);
        try std.testing.expectEqual(case.expected, result);
    }
}

fn parsePort(input: []const u8) !u16 {
    return std.fmt.parseInt(u16, input, 10);
}
```

## Table-Driven Failure Cases Too

```zig
test "parsePort rejects invalid input" {
    const invalid_inputs = [_][]const u8{ "", "abc", "-1", "99999" };
    for (invalid_inputs) |input| {
        try std.testing.expectError(error.InvalidCharacter, parsePort(input));
    }
}
```

## See Also

- [test-error-union-expect](test-error-union-expect.md) - the assertion helper used for failure-case tables
- [name-test-description](name-test-description.md) - naming the overall test block covering the table
- [test-arrange-act-assert](test-arrange-act-assert.md) - the structure each loop iteration still follows
