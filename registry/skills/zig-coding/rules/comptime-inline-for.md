# comptime-inline-for

> Use `inline for`/`inline while` to unroll loops over compile-time-known sequences (like struct fields)

## Why It Matters

An ordinary `for` loop over a runtime slice compiles to a single loop body executed repeatedly. `inline for` instead unrolls the loop at compile time, generating a separate copy of the body for each iteration — required when the loop body's *type* changes per iteration, such as iterating `@typeInfo(T).@"struct".fields`, where each field can have a different type.

## Bad

```zig
const std = @import("std");

// A regular `for` cannot do this: `field.type` differs per iteration, so
// `@field(value, field.name)` would need a different concrete type each
// time — that's only expressible if the loop is unrolled at compile time.
fn sumFields(value: anytype) void {
    for (@typeInfo(@TypeOf(value)).@"struct".fields) |field| {
        _ = @field(value, field.name); // does not compile as a runtime loop
    }
}
```

## Good

```zig
const std = @import("std");

fn sumNumericFields(value: anytype) f64 {
    var total: f64 = 0;
    inline for (@typeInfo(@TypeOf(value)).@"struct".fields) |field| {
        const v = @field(value, field.name);
        switch (@typeInfo(field.type)) {
            .int, .float => total += @floatFromInt(v),
            else => {},
        }
    }
    return total;
}

const Metrics = struct { hits: u32, misses: u32, ratio: f64 };

test "unrolled field iteration" {
    const m = Metrics{ .hits = 10, .misses = 2, .ratio = 0.83 };
    try std.testing.expect(sumNumericFields(m) > 0);
}
```

## Don't Reach for `inline for` on Ordinary Runtime Loops

If the loop body's type is the same every iteration (iterating a `[]const u32`, for example), a plain `for` is correct and compiles far more efficiently — `inline for` there would bloat the binary with N copies of an identical loop body for no benefit.

## See Also

- [comptime-typeinfo-reflect](comptime-typeinfo-reflect.md) - the field metadata `inline for` typically iterates over
- [comptime-avoid-bloat](comptime-avoid-bloat.md) - the code-size cost of unrolling large or deep sequences
- [perf-comptime-lookup-table](perf-comptime-lookup-table.md) - another common use of compile-time iteration
