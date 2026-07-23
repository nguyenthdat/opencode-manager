# comptime-typeinfo-reflect

> Use `@typeInfo` for compile-time reflection instead of hand-writing per-type logic

## Why It Matters

`@typeInfo(T)` returns a tagged union describing `T`'s structure — its fields, whether it's a struct/enum/union/pointer, its size and alignment characteristics. Combined with `comptime` control flow, this lets you write one generic function (a serializer, a pretty-printer, a validator) that adapts itself to any struct's shape at compile time, instead of maintaining a hand-written case per type.

## Bad

```zig
const std = @import("std");

// Hard-coded per type — doesn't scale, and drifts out of sync as fields change.
fn printPoint(p: Point) void {
    std.debug.print("Point{{ x: {d}, y: {d} }}\n", .{ p.x, p.y });
}

const Point = struct { x: i32, y: i32 };
```

## Good

```zig
const std = @import("std");

fn printStruct(value: anytype) void {
    const T = @TypeOf(value);
    const info = @typeInfo(T).@"struct";
    std.debug.print("{s}{{ ", .{@typeName(T)});
    inline for (info.fields, 0..) |field, i| {
        if (i != 0) std.debug.print(", ", .{});
        std.debug.print("{s}: {any}", .{ field.name, @field(value, field.name) });
    }
    std.debug.print(" }}\n", .{});
}

const Point = struct { x: i32, y: i32 };

test "generic struct printing" {
    printStruct(Point{ .x = 1, .y = 2 });
}
```

## Branching on Type Category

```zig
fn isNumeric(comptime T: type) bool {
    return switch (@typeInfo(T)) {
        .int, .float, .comptime_int, .comptime_float => true,
        else => false,
    };
}
```

## See Also

- [comptime-generic-struct](comptime-generic-struct.md) - building the generic structures `@typeInfo` inspects
- [comptime-inline-for](comptime-inline-for.md) - iterating over `@typeInfo` field lists at compile time
- [comptime-compile-error](comptime-compile-error.md) - rejecting unsupported shapes with a clear message
