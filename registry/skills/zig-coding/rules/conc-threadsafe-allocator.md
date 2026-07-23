# conc-threadsafe-allocator

> Wrap or choose a thread-safe allocator explicitly when allocating from more than one thread concurrently

## Why It Matters

Not every allocator is safe to call concurrently from multiple threads — `std.heap.GeneralPurposeAllocator`'s thread-safety depends on its configuration, and a plain `FixedBufferAllocator`/`ArenaAllocator` is not synchronized at all. Sharing an allocator across threads requires either an allocator documented as thread-safe (`std.heap.smp_allocator`, `std.heap.c_allocator`, a GPA configured with `.thread_safe = true`) or an explicit wrapper (`std.heap.ThreadSafeAllocator`) adding the necessary locking.

## Bad

```zig
const std = @import("std");

// An ArenaAllocator has no internal synchronization; calling .alloc()
// from two threads concurrently on the same arena is a data race.
fn worker(arena: *std.heap.ArenaAllocator) !void {
    _ = try arena.allocator().alloc(u8, 64);
}

fn run() !void {
    var arena = std.heap.ArenaAllocator.init(std.heap.page_allocator);
    defer arena.deinit();
    var threads: [4]std.Thread = undefined;
    for (&threads) |*t| t.* = try std.Thread.spawn(.{}, worker, .{&arena});
    for (threads) |t| t.join();
}
```

## Good

```zig
const std = @import("std");

fn worker(allocator: std.mem.Allocator) !void {
    const buf = try allocator.alloc(u8, 64);
    defer allocator.free(buf);
}

fn run() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{ .thread_safe = true }){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var threads: [4]std.Thread = undefined;
    for (&threads) |*t| t.* = try std.Thread.spawn(.{}, worker, .{allocator});
    for (threads) |t| t.join();
}
```

## Prefer Per-Thread Arenas Over a Shared One

Often the better design isn't a shared thread-safe allocator at all, but giving each thread (or each unit of work) its own arena backed by a thread-safe allocator — avoiding cross-thread allocator contention entirely. See `alloc-arena-scoped`.

## See Also

- [alloc-arena-scoped](alloc-arena-scoped.md) - a per-thread alternative that avoids sharing an allocator at all
- [alloc-gpa-debug](alloc-gpa-debug.md) - the GPA configuration this thread-safety flag applies to
- [conc-mutex-guard](conc-mutex-guard.md) - the general synchronization primitive underlying thread-safe wrappers
