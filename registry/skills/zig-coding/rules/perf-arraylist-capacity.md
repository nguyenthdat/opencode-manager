# perf-arraylist-capacity

> Pre-size `ArrayList` with `ensureTotalCapacity` before a known-size bulk append

## Why It Matters

An `ArrayList` growing organically via repeated `append` calls reallocates and copies its backing storage on each capacity doubling — for a large, known final size, that's several redundant copies of increasingly large chunks of memory. Reserving capacity once up front turns that into a single allocation, and lets you use `appendAssumeCapacity` (no per-call capacity check or possible reallocation) for the actual insertion loop.

## Bad

```zig
const std = @import("std");

fn collect(allocator: std.mem.Allocator, count: usize) ![]u32 {
    var list = std.ArrayList(u32).init(allocator);
    var i: usize = 0;
    while (i < count) : (i += 1) {
        try list.append(@intCast(i)); // repeated reallocation as the list grows
    }
    return list.toOwnedSlice();
}
```

## Good

```zig
const std = @import("std");

fn collect(allocator: std.mem.Allocator, count: usize) ![]u32 {
    var list = std.ArrayList(u32).init(allocator);
    errdefer list.deinit();
    try list.ensureTotalCapacityPrecise(count); // single allocation, sized exactly

    var i: usize = 0;
    while (i < count) : (i += 1) {
        list.appendAssumeCapacity(@intCast(i)); // no check, no reallocation possible
    }
    return list.toOwnedSlice();
}

test "pre-sized collection" {
    const result = try collect(std.testing.allocator, 1000);
    defer std.testing.allocator.free(result);
    try std.testing.expectEqual(@as(usize, 1000), result.len);
}
```

## See Also

- [alloc-capacity-hint](alloc-capacity-hint.md) - the allocator-category framing of this same technique
- [perf-avoid-alloc-hot-path](perf-avoid-alloc-hot-path.md) - a related technique for loops that append repeatedly
- [perf-benchmark-before](perf-benchmark-before.md) - confirming the collection is large enough for this to matter
