# interop-null-terminated-strings

> Handle C's null-terminated strings explicitly at the FFI boundary with `[*:0]const u8`/`[:0]const u8`

## Why It Matters

Zig's own strings are length-tracked slices with no implicit terminator; C strings rely entirely on a trailing `0` byte to mark their end, with no length stored alongside the pointer. Crossing this boundary requires an explicit, deliberate conversion in both directions — treating a `[]const u8` as if it were automatically null-terminated (or vice versa) is a classic source of buffer over-reads and C-side corruption.

## Bad

```zig
const std = @import("std");
const c = @cImport(@cInclude("string.h"));

// `name` is an ordinary Zig slice — not guaranteed null-terminated — but
// this passes its raw pointer to a C function expecting a C string.
fn cStrLen(name: []const u8) usize {
    return c.strlen(name.ptr); // reads until it happens to find a zero byte
}
```

## Good

```zig
const std = @import("std");
const c = @cImport(@cInclude("string.h"));

// Require a sentinel-terminated slice at the type level: only genuinely
// null-terminated data can be passed here, checked by the compiler.
fn cStrLen(name: [:0]const u8) usize {
    return c.strlen(name.ptr);
}

// Converting an ordinary slice at the boundary, explicitly.
fn toCStrLen(allocator: std.mem.Allocator, name: []const u8) !usize {
    const owned = try allocator.dupeZ(u8, name); // explicit, guaranteed termination
    defer allocator.free(owned);
    return cStrLen(owned);
}

test "explicit sentinel conversion at the C boundary" {
    const len = try toCStrLen(std.testing.allocator, "hello");
    try std.testing.expectEqual(@as(usize, 5), len);
}
```

## Receiving a C String From C

```zig
fn fromCString(c_str: [*:0]const u8) []const u8 {
    return std.mem.sliceTo(c_str, 0); // converts back to a length-tracked slice
}
```

## See Also

- [slice-sentinel-terminated](slice-sentinel-terminated.md) - the general sentinel-terminated slice mechanism
- [interop-c-abi-types](interop-c-abi-types.md) - the broader set of C-ABI type mappings this rule is part of
- [interop-error-boundary-c](interop-error-boundary-c.md) - translating failure (not just strings) across the same boundary
