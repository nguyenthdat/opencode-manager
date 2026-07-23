# test-std-testing-expect

> Use `std.testing.expect`/`expectEqual`/`expectEqualStrings` for clear, specific assertions

## Why It Matters

`std.testing` provides typed assertion helpers that produce a clear failure message showing both the expected and actual value — `expectEqual(expected, actual)` reports a mismatch precisely, while a bare `expect(a == b)` on failure only tells you the condition was false, not what `a` and `b` actually were.

## Bad

```zig
const std = @import("std");

test "port parsing" {
    const port = try std.fmt.parseInt(u16, "8080", 10);
    // On failure, this only says "expected true, found false" — no values shown.
    try std.testing.expect(port == 8080);
}
```

## Good

```zig
const std = @import("std");

test "port parsing" {
    const port = try std.fmt.parseInt(u16, "8080", 10);
    // On failure, this reports: "expected 8080, found <actual>".
    try std.testing.expectEqual(@as(u16, 8080), port);
}

test "string comparison" {
    const name = "alice";
    try std.testing.expectEqualStrings("alice", name);
}

test "slice comparison" {
    const values = [_]u32{ 1, 2, 3 };
    try std.testing.expectEqualSlices(u32, &.{ 1, 2, 3 }, &values);
}
```

## Choosing the Right Helper

| Helper | Use for |
|--------|---------|
| `expect(bool)` | a plain boolean condition with no natural "expected vs actual" pair |
| `expectEqual(expected, actual)` | scalar values, enums, simple structs |
| `expectEqualStrings` | `[]const u8` string comparison with a readable diff |
| `expectEqualSlices` | slice comparison element-by-element |
| `expectError` | asserting a specific error is returned |

## See Also

- [test-error-union-expect](test-error-union-expect.md) - the `expectError` helper for error-union results
- [test-arrange-act-assert](test-arrange-act-assert.md) - structuring the test this assertion belongs to
- [test-table-driven](test-table-driven.md) - reusing one assertion pattern across many cases
