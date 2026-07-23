# conc-avoid-shared-mutable

> Minimize shared mutable state; prefer message-passing through a queue over locking shared data

## Why It Matters

Every piece of state shared and mutated across threads is a potential data race and a lock to reason about correctly. A design that instead passes ownership of data between threads through a queue (each item touched by exactly one thread at a time) sidesteps the whole category of shared-mutation bugs — there's no lock to forget, no partial-update window to worry about, because the data simply isn't touched concurrently in the first place.

## Bad

```zig
const std = @import("std");

// Every worker thread reads and writes a shared results map directly,
// requiring careful locking around every single access, everywhere the
// map is touched throughout the codebase.
const SharedResults = struct {
    mutex: std.Thread.Mutex = .{},
    results: std.AutoHashMap(u32, u32),
};
```

## Good

```zig
const std = @import("std");

// Workers own their input exclusively, compute independently, and hand
// finished results to a single owning thread through a queue — no shared
// mutable map, no scattered locking to audit.
const WorkItem = struct { id: u32, input: u32 };
const ResultItem = struct { id: u32, output: u32 };

fn worker(item: WorkItem, results_queue: *Queue(ResultItem)) !void {
    const output = item.input * 2; // pure computation, no shared state touched
    try results_queue.push(.{ .id = item.id, .output = output });
}

fn Queue(comptime T: type) type {
    return struct {
        mutex: std.Thread.Mutex = .{},
        items: std.ArrayListUnmanaged(T) = .{},
        allocator: std.mem.Allocator,

        fn push(self: *@This(), item: T) !void {
            self.mutex.lock();
            defer self.mutex.unlock();
            try self.items.append(self.allocator, item);
        }
    };
}
```

## The Single Owning Thread Still Needs a Lock — Just One, in One Place

Message-passing doesn't eliminate synchronization; it concentrates it at the one boundary (the queue) where data actually crosses between threads, rather than scattering locks throughout business logic.

## See Also

- [conc-condition-variable](conc-condition-variable.md) - the queue-signaling mechanism this pattern typically uses
- [conc-mutex-guard](conc-mutex-guard.md) - the narrow, concentrated locking this pattern still requires at the queue
- [api-avoid-god-struct](api-avoid-god-struct.md) - a related principle: reducing what any one piece of state is responsible for
