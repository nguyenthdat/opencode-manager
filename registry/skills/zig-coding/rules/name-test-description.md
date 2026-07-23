# name-test-description

> Give `test` blocks descriptive string names that state what behavior is verified

## Why It Matters

A `test` block's name is a string literal, not an identifier — free-form, so there's no excuse for `test "test1"` or `test "it works"`. A descriptive name (`test "parseConfig rejects a missing required field"`) shows up directly in `zig test` output on failure, telling you immediately what broke without opening the file.

## Bad

```zig
const std = @import("std");

test "test1" {
    try std.testing.expectEqual(@as(i32, 4), 2 + 2);
}

test "works" {
    try std.testing.expect(true);
}
```

## Good

```zig
const std = @import("std");

test "parseConfig returns default port when unspecified" {
    const config = try parseConfig("");
    try std.testing.expectEqual(@as(u16, 8080), config.port);
}

test "parseConfig rejects a negative port" {
    try std.testing.expectError(error.InvalidPort, parseConfig("port=-1"));
}

const Config = struct { port: u16 = 8080 };
fn parseConfig(input: []const u8) !Config {
    if (std.mem.indexOf(u8, input, "-1") != null) return error.InvalidPort;
    return Config{};
}
```

## Group Related Tests With a Common Prefix

For a larger test suite, prefixing test names with the function or type under test (`"Parser: handles nested objects"`, `"Parser: rejects trailing commas"`) makes `zig test` output easy to scan when several tests fail at once.

## See Also

- [test-arrange-act-assert](test-arrange-act-assert.md) - structuring the test body this name describes
- [test-builtin-test-block](test-builtin-test-block.md) - the `test` block mechanism itself
- [test-table-driven](test-table-driven.md) - naming and structuring a family of similar test cases
