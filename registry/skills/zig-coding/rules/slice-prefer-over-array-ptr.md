# slice-prefer-over-array-ptr

> Accept `[]const T` slices in APIs instead of fixed-size arrays or many-item pointers

## Why It Matters

A slice (`[]const T`) is a fat pointer — pointer plus length — that works uniformly regardless of whether the backing storage is a stack array, a heap allocation, or part of a larger buffer. Accepting a fixed-size array (`[N]T`) instead locks the function to exactly one size, and accepting a raw many-item pointer (`[*]const T`) discards length information the caller already has, forcing an extra parameter and losing bounds-check safety.

## Bad

```zig
const std = @import("std");

// Locked to exactly 4 elements — a caller with 3 or 5 items can't use this
// without an artificial copy into a [4]i32.
fn sumFour(values: [4]i32) i32 {
    var total: i32 = 0;
    for (values) |v| total += v;
    return total;
}
```

## Good

```zig
const std = @import("std");

fn sum(values: []const i32) i32 {
    var total: i32 = 0;
    for (values) |v| total += v;
    return total;
}

test "slice accepts any length" {
    const three = [_]i32{ 1, 2, 3 };
    const five = [_]i32{ 1, 2, 3, 4, 5 };
    try std.testing.expectEqual(@as(i32, 6), sum(&three));
    try std.testing.expectEqual(@as(i32, 15), sum(&five));
}
```

## Arrays Still Have Their Place

Use a fixed-size array (`[N]T`) when `N` genuinely is part of the type's meaning (a 3D vector's `[3]f32`, a fixed-size hash digest) — the rule is about avoiding *unnecessary* size-locking in general-purpose functions, not eliminating arrays entirely.

## See Also

- [slice-array-vs-slice](slice-array-vs-slice.md) - deciding between array and slice for a given case
- [slice-const-when-readonly](slice-const-when-readonly.md) - adding `const` to slice parameters that don't mutate
- [slice-many-item-ptr](slice-many-item-ptr.md) - when a raw many-item pointer is actually appropriate
