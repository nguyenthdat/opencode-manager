# slice-avoid-copy

> Pass slices by their existing reference semantics instead of copying arrays into new storage

## Why It Matters

A slice is already a lightweight fat pointer (address + length) — passing it around is cheap and doesn't duplicate the underlying data. Copying elements into a new array or a freshly allocated slice "just to pass it along" adds an allocation (or a stack copy) that the slice's own semantics made unnecessary in the first place.

## Bad

```zig
const std = @import("std");

// Copies every element into a new heap allocation purely to hand it to a
// function that only needed to read the original data.
fn process(allocator: std.mem.Allocator, data: []const i32) !void {
    const copy = try allocator.dupe(i32, data);
    defer allocator.free(copy);
    try summarize(copy);
}

fn summarize(data: []const i32) !void {
    _ = data;
}
```

## Good

```zig
const std = @import("std");

fn process(data: []const i32) !void {
    try summarize(data); // pass the existing slice directly, no copy needed
}

fn summarize(data: []const i32) !void {
    _ = data;
}
```

## When a Copy Is Actually Required

Copy explicitly (and only) when ownership genuinely needs to outlive the source, such as storing a slice past the lifetime of the buffer it currently points into, or handing data across a boundary (a thread, a long-lived cache) where the original storage may be freed or reused:

```zig
const Cache = struct {
    allocator: std.mem.Allocator,
    entries: std.ArrayListUnmanaged([]u8) = .{},

    fn store(self: *Cache, data: []const u8) !void {
        const owned = try self.allocator.dupe(u8, data);
        try self.entries.append(self.allocator, owned);
    }
};
```

## See Also

- [slice-prefer-over-array-ptr](slice-prefer-over-array-ptr.md) - accepting slices in the first place to enable this
- [alloc-avoid-hidden](alloc-avoid-hidden.md) - keeping allocation decisions visible and deliberate
- [perf-slice-over-copy](perf-slice-over-copy.md) - the performance-category framing of avoiding unnecessary copies
