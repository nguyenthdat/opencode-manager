# anti-mixed-allocator-free

> Don't free memory with a different allocator than the one that allocated it

## Why It Matters

Different allocators track their own bookkeeping (size classes, arena regions, free lists) in ways specific to that allocator's implementation. Freeing memory through a different allocator than the one that produced it is undefined behavior — it may corrupt the allocator's internal state, crash immediately, or (worse) appear to work while quietly corrupting unrelated memory.

## Bad

```zig
const std = @import("std");

fn process() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();

    const buf = try arena.allocator().alloc(u8, 64);
    std.heap.page_allocator.free(buf); // wrong allocator: arena never tracked this the way page_allocator expects
}
```

## Good

```zig
const std = @import("std");

fn process() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit(); // frees everything the arena allocated, all at once, correctly

    const buf = try arena.allocator().alloc(u8, 64);
    _ = buf; // no manual free needed or wanted: the arena owns cleanup
}

// When a type stores "its" allocator, always free/deinit through that
// same stored allocator, never a different one grabbed from elsewhere.
const Buffer = struct {
    allocator: std.mem.Allocator,
    data: []u8,

    fn deinit(self: *Buffer) void {
        self.allocator.free(self.data); // the allocator this struct was given at init
    }
};
```

## See Also

- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - storing the allocator to guarantee this pairing stays correct
- [alloc-arena-scoped](alloc-arena-scoped.md) - arenas specifically don't support freeing individual allocations at all
- [alloc-free-order](alloc-free-order.md) - related discipline around correct, consistent cleanup ordering
