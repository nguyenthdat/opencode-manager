# anti-anytype-overuse

> Don't reach for `anytype` when a named `comptime T` with a real constraint would give a clearer contract

## Why It Matters

`anytype` accepts anything, deferring all validation to the function body — a caller passing the wrong kind of value gets a confusing error deep inside the implementation instead of a clear message at the call site. Overusing it where a constrained, named type parameter belongs makes an API's real requirements invisible from its signature.

## Bad

```zig
const std = @import("std");

// Nothing here documents what `items` actually needs to support; a caller
// passing the wrong shape discovers the real requirement only via a
// confusing error somewhere inside the loop body.
fn total(items: anytype) i64 {
    var sum: i64 = 0;
    for (items) |item| sum += item;
    return sum;
}
```

## Good

```zig
const std = @import("std");

fn total(comptime T: type, items: []const T) i64 {
    comptime if (@typeInfo(T) != .int) {
        @compileError("total() requires an integer element type, got " ++ @typeName(T));
    };
    var sum: i64 = 0;
    for (items) |item| sum += item;
    return sum;
}

test "constrained generic instead of anytype" {
    const values = [_]i32{ 1, 2, 3 };
    try std.testing.expectEqual(@as(i64, 6), total(i32, &values));
}
```

## See Also

- [comptime-anytype-discipline](comptime-anytype-discipline.md) - the full rule this anti-pattern violates
- [comptime-compile-error](comptime-compile-error.md) - producing the clear error message a named type parameter enables
- [perf-avoid-anytype-cost](perf-avoid-anytype-cost.md) - a related performance cost of unconstrained `anytype` fan-out
