# anti-hardcoded-buffer-size

> Don't hardcode a fixed buffer size without a real bound check, risking silent truncation or overflow

## Why It Matters

A fixed-size buffer (`[64]u8`) is fine when the actual maximum input size is genuinely known and enforced — but hardcoding a size "that should be big enough" without validating input against it invites either silent truncation (data quietly cut off) or, if bounds checking is ever bypassed, a real buffer overflow. The fix isn't to avoid fixed buffers; it's to make the bound an explicit, checked part of the contract.

## Bad

```zig
const std = @import("std");

fn formatName(first: []const u8, last: []const u8) []const u8 {
    var buf: [32]u8 = undefined; // "should be enough" for any name — until it isn't
    const result = std.fmt.bufPrint(&buf, "{s} {s}", .{ first, last }) catch buf[0..0]; // silently truncated on overflow
    return result;
}
```

## Good

```zig
const std = @import("std");

fn formatName(buf: []u8, first: []const u8, last: []const u8) ![]u8 {
    // The buffer's size is the caller's explicit responsibility, and
    // overflow is a real, surfaced error rather than a silent truncation.
    return std.fmt.bufPrint(buf, "{s} {s}", .{ first, last });
}

test "explicit buffer size and error on overflow" {
    var buf: [32]u8 = undefined;
    const result = try formatName(&buf, "Ada", "Lovelace");
    try std.testing.expectEqualStrings("Ada Lovelace", result);

    var tiny_buf: [4]u8 = undefined;
    try std.testing.expectError(error.NoSpaceLeft, formatName(&tiny_buf, "Ada", "Lovelace"));
}
```

## See Also

- [alloc-fixed-buffer](alloc-fixed-buffer.md) - using fixed buffers correctly, with an explicit, enforced bound
- [slice-bounds-safety](slice-bounds-safety.md) - relying on real bounds checking instead of assumed sizes
- [err-error-union-return](err-error-union-return.md) - surfacing overflow as a real error rather than silent truncation
