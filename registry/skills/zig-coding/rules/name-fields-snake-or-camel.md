# name-fields-snake-or-camel

> Use `snake_case` for struct fields, matching the standard library's own convention

## Why It Matters

Zig's standard library consistently uses `snake_case` for struct fields (`std.fs.File.Stat.mtime`, `std.ArrayList(T).items`, `std.mem.Allocator.vtable`) even though functions and methods are `camelCase` — this split (fields vs. functions) is a deliberate, consistent convention worth matching so your types feel native next to `std` types used alongside them.

## Bad

```zig
const std = @import("std");

const Point = struct {
    xCoordinate: f64, // fields should be snake_case, not camelCase
    yCoordinate: f64,
};
```

## Good

```zig
const std = @import("std");

const Point = struct {
    x_coordinate: f64,
    y_coordinate: f64,

    pub fn distanceTo(self: Point, other: Point) f64 { // methods stay camelCase
        const dx = self.x_coordinate - other.x_coordinate;
        const dy = self.y_coordinate - other.y_coordinate;
        return @sqrt(dx * dx + dy * dy);
    }
};

test "snake_case fields, camelCase methods" {
    const a = Point{ .x_coordinate = 0, .y_coordinate = 0 };
    const b = Point{ .x_coordinate = 3, .y_coordinate = 4 };
    try std.testing.expectEqual(@as(f64, 5), a.distanceTo(b));
}
```

## See Also

- [name-funcs-camelcase](name-funcs-camelcase.md) - the contrasting convention for functions and methods
- [api-public-fields-vs-methods](api-public-fields-vs-methods.md) - deciding whether a field should be public at all
- [name-types-titlecase](name-types-titlecase.md) - the third piece of Zig's overall naming convention set
