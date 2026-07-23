# slice-sentinel-terminated

> Use sentinel-terminated slices (`[:0]const u8`) at C-string boundaries instead of manual null-handling

## Why It Matters

A sentinel-terminated slice like `[:0]const u8` carries both a length *and* a compiler-enforced guarantee that a `0` byte follows the last element — exactly the representation C string functions expect, without giving up Zig's length-tracked slice safety internally. This avoids the classic C bug of a string that "forgot" its terminator, while still interoperating directly with `[*:0]const u8` C APIs.

## Bad

```zig
const std = @import("std");

// Manually managing a null terminator invites off-by-one and
// forgotten-terminator bugs, and doesn't communicate the guarantee in the type.
fn toCString(allocator: std.mem.Allocator, s: []const u8) ![]u8 {
    const buf = try allocator.alloc(u8, s.len + 1);
    @memcpy(buf[0..s.len], s);
    buf[s.len] = 0;
    return buf; // callers have no type-level guarantee this is null-terminated
}
```

## Good

```zig
const std = @import("std");

fn toCString(allocator: std.mem.Allocator, s: []const u8) ![:0]u8 {
    return allocator.dupeZ(u8, s); // guarantees a trailing 0, tracked by the type
}

test "sentinel-terminated allocation" {
    const cstr = try toCString(std.testing.allocator, "hello");
    defer std.testing.allocator.free(cstr);
    try std.testing.expectEqual(@as(u8, 0), cstr[cstr.len]); // the sentinel itself
}
```

## Passing to C Functions

```zig
const c = @cImport(@cInclude("string.h"));

fn cStrLen(s: [:0]const u8) usize {
    return c.strlen(s.ptr); // [:0]const u8 -> [*c]const u8 coercion is safe and implicit
}
```

## See Also

- [interop-null-terminated-strings](interop-null-terminated-strings.md) - the C-interop framing of this same guarantee
- [slice-string-as-u8](slice-string-as-u8.md) - the ordinary (non-sentinel) string representation this augments
- [slice-many-item-ptr](slice-many-item-ptr.md) - the related `[*:0]T` pointer type used at raw C boundaries
