# alloc-page-allocator

> Reach for `std.heap.page_allocator` sparingly, for large or OS-page-granularity allocations

## Why It Matters

`page_allocator` requests memory directly from the operating system in whole-page increments. It has no small-allocation optimizations and no leak detection, so every small `alloc` pays a full syscall's worth of overhead and mistakes go unnoticed. It's the right tool when you genuinely want OS-backed pages (a large arena's backing store, a memory-mapped-like buffer) — the wrong tool as a default general-purpose allocator.

## Bad

```zig
const std = @import("std");

// Using page_allocator for many small, short-lived allocations.
fn buildLabels(count: usize) ![][]u8 {
    var labels = std.ArrayList([]u8).init(std.heap.page_allocator);
    var i: usize = 0;
    while (i < count) : (i += 1) {
        const label = try std.fmt.allocPrint(std.heap.page_allocator, "item-{d}", .{i});
        try labels.append(label);
    }
    return labels.toOwnedSlice();
}
```

## Good

```zig
const std = @import("std");

// Let the caller decide the strategy; a GPA or arena amortizes small allocs
// far better than going to the OS for each one.
fn buildLabels(allocator: std.mem.Allocator, count: usize) ![][]u8 {
    var labels = std.ArrayList([]u8).init(allocator);
    defer labels.deinit();
    var i: usize = 0;
    while (i < count) : (i += 1) {
        const label = try std.fmt.allocPrint(allocator, "item-{d}", .{i});
        try labels.append(label);
    }
    return labels.toOwnedSlice();
}

// page_allocator is the right choice as an arena's *backing* allocator,
// where allocations are already coarse-grained:
fn withArena(comptime run: fn (std.mem.Allocator) anyerror!void) !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    try run(arena.allocator());
}
```

## See Also

- [alloc-arena-scoped](alloc-arena-scoped.md) - amortize page_allocator's overhead across many small allocations
- [alloc-gpa-debug](alloc-gpa-debug.md) - a safer default for general-purpose allocation during development
- [alloc-fixed-buffer](alloc-fixed-buffer.md) - avoid the OS heap entirely for bounded, small allocations
