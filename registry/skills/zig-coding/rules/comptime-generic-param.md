# comptime-generic-param

> Use `comptime` type parameters for generic functions instead of a separate generics syntax

## Why It Matters

Zig has no dedicated generics syntax (`<T>`, `template<T>`) — instead, a type is just an ordinary value of type `type`, and `comptime` parameters let a function accept a type as an argument like any other value. The function is instantiated (monomorphized) once per distinct set of comptime arguments, giving you specialized, zero-overhead code without a separate generics feature to learn.

## Bad

```zig
const std = @import("std");

// Duplicating a function per type instead of parameterizing over `comptime T`.
fn maxI32(a: i32, b: i32) i32 {
    return if (a > b) a else b;
}
fn maxF64(a: f64, b: f64) f64 {
    return if (a > b) a else b;
}
```

## Good

```zig
const std = @import("std");

fn max(comptime T: type, a: T, b: T) T {
    return if (a > b) a else b;
}

test "max works across types" {
    try std.testing.expectEqual(@as(i32, 5), max(i32, 3, 5));
    try std.testing.expectEqual(@as(f64, 2.5), max(f64, 2.5, 1.0));
}
```

## Generic Over a Value, Not Just a Type

`comptime` parameters aren't limited to types — any parameter can be `comptime` if it needs to be known at compile time (e.g. to size an array):

```zig
fn FixedBuffer(comptime capacity: usize) type {
    return struct {
        data: [capacity]u8 = undefined,
        len: usize = 0,
    };
}

test "fixed buffer size is part of the type" {
    var buf: FixedBuffer(64) = .{};
    try std.testing.expectEqual(@as(usize, 64), buf.data.len);
}
```

## See Also

- [comptime-generic-struct](comptime-generic-struct.md) - the same technique applied to whole data structures
- [comptime-anytype-discipline](comptime-anytype-discipline.md) - when `anytype` is appropriate instead of a named `comptime T`
- [comptime-avoid-bloat](comptime-avoid-bloat.md) - the cost of over-using generic instantiation
