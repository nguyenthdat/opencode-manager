# conc-mutex-guard

> Use `std.Thread.Mutex` to guard shared mutable state accessed from more than one thread

## Why It Matters

Zig has no compiler-enforced data-race prevention (no borrow checker) — a `std.Thread.Mutex` is an ordinary runtime lock, and it's entirely the programmer's responsibility to acquire it around every access to shared mutable state and to keep the locked region as small as possible. Skipping this for data genuinely shared across threads is a data race: undefined behavior, not just a rare bug.

## Bad

```zig
const std = @import("std");

const Counter = struct {
    value: u32 = 0,

    // No synchronization at all — concurrent calls from multiple threads
    // race on `value`, corrupting it unpredictably.
    fn increment(self: *Counter) void {
        self.value += 1;
    }
};
```

## Good

```zig
const std = @import("std");

const Counter = struct {
    mutex: std.Thread.Mutex = .{},
    value: u32 = 0,

    fn increment(self: *Counter) void {
        self.mutex.lock();
        defer self.mutex.unlock();
        self.value += 1;
    }

    fn get(self: *Counter) u32 {
        self.mutex.lock();
        defer self.mutex.unlock();
        return self.value;
    }
};

test "mutex-guarded counter across threads" {
    var counter = Counter{};
    var threads: [4]std.Thread = undefined;
    for (&threads) |*t| {
        t.* = try std.Thread.spawn(.{}, Counter.increment, .{&counter});
    }
    for (threads) |t| t.join();
    try std.testing.expectEqual(@as(u32, 4), counter.get());
}
```

## Keep the Locked Region Small

Lock immediately before the shared access and unlock (via `defer`) immediately after — holding a mutex across unrelated work (I/O, allocation, another lock) invites contention and, with two mutexes, deadlock.

## See Also

- [conc-atomic-ops](conc-atomic-ops.md) - a lock-free alternative for simple counters/flags
- [conc-condition-variable](conc-condition-variable.md) - coordinating threads beyond simple mutual exclusion
- [conc-avoid-shared-mutable](conc-avoid-shared-mutable.md) - reducing how much state needs a mutex at all
