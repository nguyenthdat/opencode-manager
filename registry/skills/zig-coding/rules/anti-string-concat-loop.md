# anti-string-concat-loop

> Don't repeatedly allocate via `allocPrint`/`concat` inside a loop — use a writer or growable buffer instead

## Why It Matters

Each call to `std.fmt.allocPrint`/`std.mem.concat` allocates a brand-new buffer and copies everything into it. Calling one of these inside a loop to "build up" a string means every iteration reallocates and re-copies everything accumulated so far — O(n²) total work for what should be an O(n) operation, and n separate allocations where one (amortized, growable) buffer would do.

## Bad

```zig
const std = @import("std");

fn buildCsv(allocator: std.mem.Allocator, rows: []const []const u8) ![]u8 {
    var result: []u8 = try allocator.dupe(u8, "");
    for (rows) |row| {
        const next = try std.mem.concat(allocator, u8, &.{ result, row, "," });
        allocator.free(result); // each iteration: allocate + copy everything so far again
        result = next;
    }
    return result;
}
```

## Good

```zig
const std = @import("std");

fn buildCsv(allocator: std.mem.Allocator, rows: []const []const u8) ![]u8 {
    var out = std.ArrayList(u8).init(allocator);
    errdefer out.deinit();
    for (rows) |row| {
        try out.appendSlice(row);
        try out.append(',');
    }
    return out.toOwnedSlice(); // one growable buffer, amortized O(n) total
}

test "single growable buffer instead of repeated concat" {
    const result = try buildCsv(std.testing.allocator, &.{ "a", "b", "c" });
    defer std.testing.allocator.free(result);
    try std.testing.expectEqualStrings("a,b,c,", result);
}
```

## See Also

- [slice-concat-alloc](slice-concat-alloc.md) - the full rule this anti-pattern violates
- [perf-avoid-alloc-hot-path](perf-avoid-alloc-hot-path.md) - the general performance principle behind avoiding per-iteration allocation
- [perf-arraylist-capacity](perf-arraylist-capacity.md) - pre-sizing the growable buffer when the final size is known
