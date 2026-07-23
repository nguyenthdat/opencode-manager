# api-struct-methods

> Use struct methods (`self: Self`/`self: *Self`) for behavior that's conceptually tied to a type

## Why It Matters

A function declared inside a struct with a `self` parameter is called with `value.method(...)` syntax — purely a namespacing and ergonomics convenience, since Zig has no real "object model" underneath. Using this consistently for behavior that conceptually belongs to a type (rather than a bare free function taking the type as its first argument) keeps related operations discoverable via the type itself and matches standard library conventions.

## Bad

```zig
const std = @import("std");

const Point = struct { x: f64, y: f64 };

// A free function works, but scatters "things you can do with a Point"
// away from the Point type itself, and doesn't support `point.length()` syntax.
fn pointLength(p: Point) f64 {
    return @sqrt(p.x * p.x + p.y * p.y);
}
```

## Good

```zig
const std = @import("std");

const Point = struct {
    x: f64,
    y: f64,

    pub fn length(self: Point) f64 {
        return @sqrt(self.x * self.x + self.y * self.y);
    }

    pub fn add(self: Point, other: Point) Point {
        return .{ .x = self.x + other.x, .y = self.y + other.y };
    }
};

test "struct methods" {
    const p = Point{ .x = 3, .y = 4 };
    try std.testing.expectEqual(@as(f64, 5), p.length());
}
```

## Value vs. Pointer Receiver

See `api-self-value-vs-ptr` for the rule on choosing `self: Point` (read-only, cheap to copy) vs. `self: *Point` (mutates the caller's instance) — both are "methods" in this same sense, just differing in whether they can observe mutation.

## See Also

- [api-self-value-vs-ptr](api-self-value-vs-ptr.md) - choosing between value and pointer receivers
- [api-namespace-file](api-namespace-file.md) - the file-as-namespace convention this pattern complements
- [name-funcs-camelcase](name-funcs-camelcase.md) - naming conventions for methods and functions
