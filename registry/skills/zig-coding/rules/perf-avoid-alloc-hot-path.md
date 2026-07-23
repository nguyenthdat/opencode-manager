# perf-avoid-alloc-hot-path

> Avoid allocating inside hot loops; reuse a buffer allocated once outside the loop

## Why It Matters

Every allocation, even from a fast allocator, involves bookkeeping (finding free space, updating metadata) that adds up when repeated millions of times in a hot loop. Allocating a scratch buffer once, outside the loop, and reusing it (clearing/resetting length rather than freeing and reallocating) removes that cost entirely from the loop's steady-state execution.

## Bad

```zig
const std = @import("std");

fn processLines(allocator: std.mem.Allocator, lines: []const []const u8) !void {
    for (lines) |line| {
        var buf = std.ArrayList(u8).init(allocator);
        defer buf.deinit(); // allocates and frees on every single iteration
        try buf.appendSlice(line);
        try buf.append('\n');
        try handle(buf.items);
    }
}

fn handle(data: []const u8) !void {
    _ = data;
}
```

## Good

```zig
const std = @import("std");

fn processLines(allocator: std.mem.Allocator, lines: []const []const u8) !void {
    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(); // allocated once, reused every iteration

    for (lines) |line| {
        buf.clearRetainingCapacity(); // reuse the existing backing storage
        try buf.appendSlice(line);
        try buf.append('\n');
        try handle(buf.items);
    }
}

fn handle(data: []const u8) !void {
    _ = data;
}
```

## Measure Before Assuming This Matters

This optimization is worth applying in a loop that runs thousands or millions of times per invocation; for a loop that runs a handful of times, the allocator overhead is noise. See `perf-benchmark-before`.

## See Also

- [mem-reuse-collections](../rust-coding/rules/mem-reuse-collections.md) - the analogous Rust idiom, for comparison
- [alloc-arena-scoped](alloc-arena-scoped.md) - an alternative when reuse-by-clear doesn't fit the shape of the work
- [perf-benchmark-before](perf-benchmark-before.md) - confirming the loop is actually hot before optimizing it
