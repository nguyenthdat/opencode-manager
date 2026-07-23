# comptime-avoid-bloat

> Avoid comptime bloat from excessive or unnecessary generic instantiation

## Why It Matters

Every distinct set of `comptime` arguments to a generic function produces a fully separate instantiation in the binary — its own copy of the function body, specialized and compiled independently. This is exactly what makes Zig generics zero-overhead at runtime, but instantiating the same generic over dozens of near-identical types (every integer width, every small variation of a config struct) multiplies compile time and binary size for little runtime benefit.

## Bad

```zig
const std = @import("std");

fn Serializer(comptime T: type) type {
    return struct {
        pub fn write(value: T, writer: anytype) !void {
            // ... substantial serialization logic ...
            try writer.print("{any}", .{value});
        }
    };
}

// Instantiated once per distinct integer width used anywhere in the program —
// u8, u16, u32, u64, usize, i32, i64 all produce separate full copies of
// `write`, even though the logic barely differs.
const S8 = Serializer(u8);
const S16 = Serializer(u16);
const S32 = Serializer(u32);
const S64 = Serializer(u64);
```

## Good

```zig
const std = @import("std");

// Route all integer widths through one non-generic (or minimally generic)
// core using a runtime-sized representation, and only specialize the thin
// public wrapper.
fn writeInt(value: anytype, writer: anytype) !void {
    const T = @TypeOf(value);
    switch (@typeInfo(T)) {
        .int => try writer.print("{d}", .{value}),
        else => @compileError("writeInt expects an integer, got " ++ @typeName(T)),
    }
}
```

## Practical Guidelines

- Keep the truly generic "hot" logic small; push type-specific branching to the edges.
- Prefer `anytype` + a runtime `switch` on `@typeInfo` over instantiating a whole generic type per variant, when the variants are numerous and the logic is shared.
- Watch build times: a sudden compile-time regression after adding a generic type used across many call sites is a signal to check instantiation count.

## See Also

- [comptime-generic-struct](comptime-generic-struct.md) - the mechanism whose overuse this rule warns about
- [perf-avoid-anytype-cost](perf-avoid-anytype-cost.md) - the performance-category framing of the same trade-off
- [anti-comptime-bloat](anti-comptime-bloat.md) - the anti-pattern write-up of unchecked generic sprawl
