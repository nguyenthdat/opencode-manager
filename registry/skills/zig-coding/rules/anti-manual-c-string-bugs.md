# anti-manual-c-string-bugs

> Don't hand-roll C string handling — missing terminators and wrong lengths are easy, silent mistakes

## Why It Matters

C string functions rely entirely on a trailing `0` byte to know where a string ends; there's no length passed alongside. Manually constructing a buffer meant to look like a C string, without going through `[:0]const u8`/`dupeZ` (which the compiler verifies), invites forgetting the terminator, miscounting the buffer size, or off-by-one errors — bugs that manifest as buffer over-reads on the C side, often far from where the mistake was actually made.

## Bad

```zig
const std = @import("std");
const c = @cImport(@cInclude("string.h"));

fn makeCString(allocator: std.mem.Allocator, s: []const u8) ![]u8 {
    // No null terminator appended at all — c.strlen on this buffer reads
    // past the end into whatever memory happens to follow it.
    const buf = try allocator.alloc(u8, s.len);
    @memcpy(buf, s);
    return buf;
}
```

## Good

```zig
const std = @import("std");
const c = @cImport(@cInclude("string.h"));

fn makeCString(allocator: std.mem.Allocator, s: []const u8) ![:0]u8 {
    return allocator.dupeZ(u8, s); // the compiler verifies the sentinel is present
}

test "safe C string construction" {
    const cstr = try makeCString(std.testing.allocator, "hi");
    defer std.testing.allocator.free(cstr);
    try std.testing.expectEqual(@as(usize, 2), c.strlen(cstr.ptr));
}
```

## See Also

- [slice-sentinel-terminated](slice-sentinel-terminated.md) - the full rule this anti-pattern violates
- [interop-null-terminated-strings](interop-null-terminated-strings.md) - the C-interop framing of the same concern
- [interop-c-abi-types](interop-c-abi-types.md) - broader C type-mapping mistakes to watch for
