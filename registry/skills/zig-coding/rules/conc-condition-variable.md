# conc-condition-variable

> Use `std.Thread.Condition` to wait for and signal a state change, instead of busy-polling a flag

## Why It Matters

A thread that needs to wait for another thread's work to reach some state (a queue becoming non-empty, a shutdown flag being set) should block efficiently until signaled — spinning in a loop that repeatedly checks a flag wastes CPU and adds latency between the state actually changing and the waiting thread noticing. `std.Thread.Condition`, used together with the mutex guarding the shared state, lets a thread sleep until explicitly woken.

## Bad

```zig
const std = @import("std");

const Queue = struct {
    mutex: std.Thread.Mutex = .{},
    items: std.ArrayListUnmanaged(u32) = .{},

    fn waitForItem(self: *Queue, allocator: std.mem.Allocator) u32 {
        // Busy-polls in a tight loop, burning CPU while waiting for a
        // producer thread to add an item.
        while (true) {
            self.mutex.lock();
            if (self.items.items.len > 0) {
                const item = self.items.orderedRemove(0);
                self.mutex.unlock();
                return item;
            }
            self.mutex.unlock();
        }
        _ = allocator;
    }
};
```

## Good

```zig
const std = @import("std");

const Queue = struct {
    mutex: std.Thread.Mutex = .{},
    condition: std.Thread.Condition = .{},
    items: std.ArrayListUnmanaged(u32) = .{},
    allocator: std.mem.Allocator,

    fn push(self: *Queue, item: u32) !void {
        self.mutex.lock();
        defer self.mutex.unlock();
        try self.items.append(self.allocator, item);
        self.condition.signal(); // wake one waiting consumer
    }

    fn waitForItem(self: *Queue) u32 {
        self.mutex.lock();
        defer self.mutex.unlock();
        while (self.items.items.len == 0) {
            self.condition.wait(&self.mutex); // sleeps until signaled, no busy-polling
        }
        return self.items.orderedRemove(0);
    }
};
```

## See Also

- [conc-mutex-guard](conc-mutex-guard.md) - the mutex a condition variable is always paired with
- [conc-thread-spawn](conc-thread-spawn.md) - the producer/consumer threads coordinating through this queue
- [conc-avoid-shared-mutable](conc-avoid-shared-mutable.md) - message-passing designs this pattern supports
