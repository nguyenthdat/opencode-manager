# opt-switch-exhaustive

> Rely on exhaustive `switch` over enums and tagged unions — let the compiler enforce completeness

## Why It Matters

A `switch` over a closed `enum` or `union(enum)` with every variant listed (no `else`) is checked by the compiler for exhaustiveness: adding a new variant later makes every such `switch` in the codebase fail to compile until it's updated. This turns "did I remember to handle the new case everywhere?" from a manual audit into a build error, which is one of the strongest correctness guarantees Zig gives you for free.

## Bad

```zig
const std = @import("std");

const Shape = union(enum) {
    circle: f64,
    square: f64,
    rectangle: struct { w: f64, h: f64 },
};

fn area(shape: Shape) f64 {
    return switch (shape) {
        .circle => |r| std.math.pi * r * r,
        .square => |s| s * s,
        else => 0, // silently wrong for `.rectangle`, and hides the mistake
    };
}
```

## Good

```zig
const std = @import("std");

const Shape = union(enum) {
    circle: f64,
    square: f64,
    rectangle: struct { w: f64, h: f64 },
};

fn area(shape: Shape) f64 {
    return switch (shape) {
        .circle => |r| std.math.pi * r * r,
        .square => |s| s * s,
        .rectangle => |rect| rect.w * rect.h,
        // No `else`: adding a new Shape variant now fails to compile here,
        // forcing a deliberate decision about its area.
    };
}

test "exhaustive area calculation" {
    try std.testing.expectApproxEqAbs(@as(f64, 25.0), area(.{ .square = 5.0 }), 0.001);
}
```

## See Also

- [api-tagged-union-variants](api-tagged-union-variants.md) - designing the closed variant sets this rule switches over
- [opt-switch-else-explicit](opt-switch-else-explicit.md) - when an `else` prong is the deliberate, correct choice instead
- [err-switch-exhaustive-err](err-switch-exhaustive-err.md) - the same exhaustiveness principle applied to error sets
