# alloc-capacity-hint

> Pre-size containers with `ensureTotalCapacity`/`initCapacity` when the count is known

## Why It Matters

Growable containers (`ArrayList`, `HashMap`) reallocate and copy their backing storage as they grow past capacity, typically doubling. If the final size is known or reasonably estimable ahead of time, reserving capacity up front turns O(log n) reallocations plus O(n) copying into a single allocation — a meaningful win for large collections built in a loop.

## Bad

```zig
const std = @import("std");

fn collectIds(allocator: std.mem.Allocator, rows: []const Row) ![]u32 {
    var ids = std.ArrayList(u32).init(allocator);
    // No capacity hint — reallocates repeatedly as `rows` grows large.
    for (rows) |row| {
        try ids.append(row.id);
    }
    return ids.toOwnedSlice();
}
```

## Good

```zig
const std = @import("std");

fn collectIds(allocator: std.mem.Allocator, rows: []const Row) ![]u32 {
    var ids = std.ArrayList(u32).init(allocator);
    errdefer ids.deinit();
    try ids.ensureTotalCapacityPrecise(rows.len); // one allocation, sized exactly

    for (rows) |row| {
        ids.appendAssumeCapacity(row.id); // no error check needed: capacity is guaranteed
    }
    return ids.toOwnedSlice();
}
```

## HashMap Capacity Hints

The same principle applies to hash maps and sets — reserve buckets before a known-size bulk insert:

```zig
var map = std.AutoHashMap(u32, []const u8).init(allocator);
defer map.deinit();
try map.ensureTotalCapacity(@intCast(entries.len));
for (entries) |entry| {
    map.putAssumeCapacity(entry.key, entry.value);
}
```

## Don't Over-Reserve Speculatively

Only pre-size when you have a real count or a solid upper bound (`rows.len`, a length prefix read from a file). Guessing a large capacity "just in case" wastes memory for the common case where the collection stays small — that's what the default growth strategy already handles well.

## See Also

- [mem-with-capacity](../rust-coding/rules/mem-with-capacity.md) - the equivalent Rust rule, for cross-language comparison
- [perf-arraylist-capacity](perf-arraylist-capacity.md) - the performance-category framing of this same technique
- [alloc-arraylist-managed](alloc-arraylist-managed.md) - managed vs. unmanaged container basics this builds on
