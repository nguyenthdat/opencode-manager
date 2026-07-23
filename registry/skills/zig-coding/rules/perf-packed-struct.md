# perf-packed-struct

> Use `packed struct` for memory-dense layouts when bit-level packing matters

## Why It Matters

An ordinary Zig struct's field layout and padding are unspecified (the compiler may reorder fields for alignment); a `packed struct` guarantees fields are laid out with no padding, in declaration order, at the bit level — exactly what you need for a hardware register description, a wire-format header, or a large array of small structs where per-element padding would waste significant memory.

## Bad

```zig
const std = @import("std");

// An ordinary struct here may include padding between `flag` and `value`
// that wastes memory across a million-element array, and gives no
// guarantee about bit-level layout for something like a hardware register.
const StatusRegister = struct {
    enabled: bool,
    error_flag: bool,
    mode: u2,
    reserved: u4,
};
```

## Good

```zig
const std = @import("std");

const StatusRegister = packed struct(u8) {
    enabled: bool,
    error_flag: bool,
    mode: u2,
    reserved: u4 = 0,
};

test "packed struct is exactly one byte" {
    try std.testing.expectEqual(1, @sizeOf(StatusRegister));
    const reg: StatusRegister = .{ .enabled = true, .error_flag = false, .mode = 2 };
    const raw: u8 = @bitCast(reg);
    try std.testing.expectEqual(@as(u8, 0b0000_1001), raw);
}
```

## Packed Structs for Large Homogeneous Arrays

```zig
const Pixel = packed struct(u16) { r: u5, g: u6, b: u5 }; // RGB565, 2 bytes each

fn totalBytes(count: usize) usize {
    return count * @sizeOf(Pixel); // exactly 2 bytes per pixel, no padding
}
```

## See Also

- [interop-extern-struct](interop-extern-struct.md) - the C-ABI-compatible counterpart, `extern struct`
- [mem-smaller-integers](../rust-coding/rules/mem-smaller-integers.md) - the analogous Rust concern about field sizing
- [perf-struct-of-arrays](perf-struct-of-arrays.md) - a complementary layout technique for large collections
