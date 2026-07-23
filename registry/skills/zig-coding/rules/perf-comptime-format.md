# perf-comptime-format

> Use comptime-known format strings so `std.fmt` can validate and specialize formatting at compile time

## Why It Matters

When the format string passed to `std.fmt.format`/`print`/`allocPrint` is a compile-time-known string literal, the compiler validates its placeholders against the argument tuple's types at compile time and generates specialized formatting code for exactly those types — a mismatch (wrong placeholder count, incompatible type) is a compile error, not a runtime surprise, and there's no runtime parsing of the format string itself.

## Bad

```zig
const std = @import("std");

// Building the format string at runtime defeats compile-time validation
// entirely, and reformatting/parsing it happens on every call.
fn logValue(allocator: std.mem.Allocator, comptime label_count: usize, value: i32) ![]u8 {
    var fmt_buf: [32]u8 = undefined;
    const fmt = std.fmt.bufPrint(&fmt_buf, "value = {{d}}", .{}) catch unreachable;
    _ = label_count;
    return std.fmt.allocPrint(allocator, fmt, .{value});
}
```

## Good

```zig
const std = @import("std");

fn logValue(allocator: std.mem.Allocator, value: i32) ![]u8 {
    // The format string is a comptime-known literal: placeholders are
    // checked against `.{value}`'s types at compile time.
    return std.fmt.allocPrint(allocator, "value = {d}", .{value});
}

test "comptime-checked format string" {
    const msg = try logValue(std.testing.allocator, 42);
    defer std.testing.allocator.free(msg);
    try std.testing.expectEqualStrings("value = 42", msg);
}
```

## Genuinely Dynamic Formatting

When the shape of the output truly must vary at runtime (a user-configurable log format), build it from concatenated comptime-known pieces or a small explicit switch over known formats — rather than constructing an arbitrary runtime string and feeding it to `std.fmt` as if it were a literal, which isn't supported the same way.

## See Also

- [comptime-known-int](comptime-known-int.md) - compile-time values commonly interpolated into these format strings
- [slice-concat-alloc](slice-concat-alloc.md) - the allocator-aware string-building this formatting relies on
- [anti-string-concat-loop](anti-string-concat-loop.md) - a related performance trap in repeated string building
