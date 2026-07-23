# slice-array-vs-slice

> Use a fixed-size array `[N]T` when length is a compile-time property of the type; use a slice for runtime-determined length

## Why It Matters

`[N]T` and `[]T` look similar but answer different questions. An array's length is part of its type — `[3]f32` and `[4]f32` are different types entirely, which is exactly right when the size is a fixed, meaningful property (a 3D vector, an MD5 digest). A slice's length is a runtime value carried alongside the pointer — right when the size varies by input, by allocation, or over the program's lifetime.

## Bad

```zig
const std = @import("std");

// The size here isn't meaningful — it's just "how many names happened to
// be passed" — so hard-coding it as an array type is needlessly restrictive.
fn printNames(names: [10]([]const u8)) void {
    for (names) |name| std.debug.print("{s}\n", .{name});
}
```

## Good

```zig
const std = @import("std");

// Runtime-determined count: a slice.
fn printNames(names: []const []const u8) void {
    for (names) |name| std.debug.print("{s}\n", .{name});
}

// Compile-time-fixed, meaningful size: an array.
const Vec3 = struct {
    components: [3]f32,

    fn dot(self: Vec3, other: Vec3) f32 {
        var total: f32 = 0;
        for (self.components, other.components) |a, b| total += a * b;
        return total;
    }
};

test "array size is part of the type" {
    const v = Vec3{ .components = .{ 1, 2, 3 } };
    try std.testing.expectEqual(@as(f32, 14), v.dot(v));
}
```

## Slicing an Array

An array can always be turned into a slice with `&array` or `array[start..end]` — this is the common bridge between the two, and it's what most functions accepting `[]const T` actually receive when called with array-backed data.

## See Also

- [slice-prefer-over-array-ptr](slice-prefer-over-array-ptr.md) - preferring slices for API parameters specifically
- [perf-packed-struct](perf-packed-struct.md) - array fields inside memory-dense packed structs
- [slice-many-item-ptr](slice-many-item-ptr.md) - the third pointer flavor, for raw/unmanaged-length data
