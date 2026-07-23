# comptime-compile-error

> Use `@compileError` to reject invalid generic instantiations with a clear message

## Why It Matters

Without an explicit check, passing the wrong type to a generic function produces a confusing error deep inside the implementation, often several calls removed from the actual mistake. A `comptime` guard with `@compileError` fails fast, at the point of misuse, with a message that says exactly what went wrong and what was expected.

## Bad

```zig
const std = @import("std");

// No validation: passing a non-numeric T fails somewhere inside the loop
// body with an unhelpful "invalid operands to binary expression" error.
fn average(comptime T: type, items: []const T) T {
    var total: T = 0;
    for (items) |item| total += item;
    return total / @as(T, @intCast(items.len));
}
```

## Good

```zig
const std = @import("std");

fn average(comptime T: type, items: []const T) T {
    comptime switch (@typeInfo(T)) {
        .int, .float => {},
        else => @compileError("average() requires a numeric type, got " ++ @typeName(T)),
    };

    var total: T = 0;
    for (items) |item| total += item;
    return total / @as(T, @intCast(items.len));
}

test "average rejects non-numeric types at compile time" {
    const values = [_]i32{ 1, 2, 3 };
    try std.testing.expectEqual(@as(i32, 2), average(i32, &values));
    // average(bool, &.{true}) would fail to compile with a clear message.
}
```

## Combine With `@typeName` for Precise Messages

```zig
fn requireStruct(comptime T: type) void {
    if (@typeInfo(T) != .@"struct") {
        @compileError(@typeName(T) ++ " must be a struct type");
    }
}
```

## See Also

- [comptime-anytype-discipline](comptime-anytype-discipline.md) - deciding between `anytype` and a validated `comptime T`
- [comptime-config-validate](comptime-config-validate.md) - the same mechanism applied to configuration values, not just types
- [comptime-typeinfo-reflect](comptime-typeinfo-reflect.md) - the reflection API these checks are built on
