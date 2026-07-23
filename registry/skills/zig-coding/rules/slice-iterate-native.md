# slice-iterate-native

> Iterate slices with `for (items) |item|` instead of manual index bookkeeping

## Why It Matters

Zig's `for` loop over a slice hands you each element directly (and, with the `, 0..` form, the index alongside it) without a separate counter variable to declare, increment, and keep in sync with the bounds. It's shorter, removes an entire class of off-by-one mistakes, and reads as "for each item" rather than "while some counter is less than the length."

## Bad

```zig
const std = @import("std");

fn sum(items: []const i32) i32 {
    var total: i32 = 0;
    var i: usize = 0;
    while (i < items.len) : (i += 1) {
        total += items[i];
    }
    return total;
}
```

## Good

```zig
const std = @import("std");

fn sum(items: []const i32) i32 {
    var total: i32 = 0;
    for (items) |item| total += item;
    return total;
}

fn withIndex(items: []const i32) void {
    for (items, 0..) |item, i| {
        std.debug.print("{d}: {d}\n", .{ i, item });
    }
}

test "native slice iteration" {
    const values = [_]i32{ 1, 2, 3 };
    try std.testing.expectEqual(@as(i32, 6), sum(&values));
}
```

## Iterating Multiple Slices in Lockstep

`for` accepts several slices at once, iterating them together (they must share the same length, checked at runtime in safe builds):

```zig
fn dot(a: []const f32, b: []const f32) f32 {
    var total: f32 = 0;
    for (a, b) |x, y| total += x * y;
    return total;
}
```

## When a Manual Index Is Still Right

Reach for an explicit `while` with an index when the step isn't 1, when you need to look ahead/behind within the same loop, or when mutating the loop variable itself — `for` intentionally doesn't support those.

## See Also

- [opt-while-capture](opt-while-capture.md) - the `while` form for iterator-style (`next() ?T`) loops
- [slice-prefer-over-array-ptr](slice-prefer-over-array-ptr.md) - the slice type this loop form operates on
- [opt-labeled-break](opt-labeled-break.md) - structured exits from nested iteration
