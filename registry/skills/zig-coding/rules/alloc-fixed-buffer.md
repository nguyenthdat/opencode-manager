# alloc-fixed-buffer

> Use `FixedBufferAllocator` for bounded, stack-backed allocations with no heap traffic

## Why It Matters

`std.heap.FixedBufferAllocator` carves allocations out of a caller-supplied `[]u8` buffer — often a stack array — and never touches the OS heap. It's the right choice when the maximum size needed is known ahead of time (a fixed-size scratch buffer for formatting, a small parser workspace) and you want allocation failure to be a clear, local `error.OutOfMemory` rather than a syscall.

## Bad

```zig
const std = @import("std");

// Heap-allocating a small, bounded scratch buffer for one-shot formatting.
fn formatId(allocator: std.mem.Allocator, id: u32) ![]u8 {
    return std.fmt.allocPrint(allocator, "id-{d}", .{id});
}
```

## Good

```zig
const std = @import("std");

fn formatId(id: u32) ![]const u8 {
    var buf: [32]u8 = undefined;
    var fba = std.heap.FixedBufferAllocator.init(&buf);
    return std.fmt.allocPrint(fba.allocator(), "id-{d}", .{id});
}

// Or skip the allocator entirely when std.fmt.bufPrint suffices:
fn formatIdSimple(buf: []u8, id: u32) ![]u8 {
    return std.fmt.bufPrint(buf, "id-{d}", .{id});
}
```

## Handling Exhaustion

A `FixedBufferAllocator` returns `error.OutOfMemory` the instant the backing buffer is full — there is no fallback to the heap. Size the buffer generously for the known worst case and treat overflow as a real error, not something to silently grow:

```zig
var buf: [4096]u8 = undefined;
var fba = std.heap.FixedBufferAllocator.init(&buf);
const list = std.ArrayList(u32).init(fba.allocator());
_ = list.appendSlice(large_input) catch |err| switch (err) {
    error.OutOfMemory => return error.ScratchBufferTooSmall,
};
```

## See Also

- [alloc-arena-scoped](alloc-arena-scoped.md) - heap-backed alternative when the size isn't bounded
- [alloc-page-allocator](alloc-page-allocator.md) - the OS-level allocator FixedBufferAllocator avoids calling
- [perf-avoid-alloc-hot-path](perf-avoid-alloc-hot-path.md) - eliminating allocation from hot loops entirely
