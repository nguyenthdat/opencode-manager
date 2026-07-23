# conc-thread-spawn

> Use `std.Thread.spawn` for OS threads, with an explicit `join` (or detach, deliberately)

## Why It Matters

Zig has no built-in green threads or async runtime in current releases — concurrency is expressed with real OS threads via `std.Thread`. Every spawned thread needs an explicit decision about its lifetime: `join()` blocks until it finishes (the common, safe default), while `detach()` lets it run independently, which is riskier since nothing then guarantees it finishes before the process exits or before data it references is freed.

## Bad

```zig
const std = @import("std");

fn run() void {
    const thread = std.Thread.spawn(.{}, worker, .{}) catch return;
    // No join, no detach — the thread's fate (and the lifetime of
    // anything it captured) is left entirely unaccounted for.
    _ = thread;
}

fn worker() void {}
```

## Good

```zig
const std = @import("std");

fn run() !void {
    const thread = try std.Thread.spawn(.{}, worker, .{42});
    defer thread.join(); // blocks here until the worker finishes, guaranteed
}

fn worker(value: u32) void {
    std.debug.print("worker got {d}\n", .{value});
}

test "spawn and join a thread" {
    try run();
}
```

## Passing Data Into a Thread Safely

Arguments to `std.Thread.spawn` are copied into the new thread's context — safe for values, but pointers/slices still require the referenced data to outlive the thread (guaranteed here by `join`ing before the enclosing function returns).

## See Also

- [conc-mutex-guard](conc-mutex-guard.md) - protecting data shared between the spawning thread and the worker
- [conc-avoid-shared-mutable](conc-avoid-shared-mutable.md) - minimizing what needs to be shared in the first place
- [conc-no-async-await](conc-no-async-await.md) - why threads, not async/await, are the current concurrency primitive
