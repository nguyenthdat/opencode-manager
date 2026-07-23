# conc-atomic-ops

> Use `std.atomic` for simple lock-free counters and flags shared across threads

## Why It Matters

For a single counter, flag, or pointer swap, a full mutex is more machinery than necessary — `std.atomic.Value(T)` wraps atomic load/store/fetchAdd/compareAndSwap operations directly, avoiding lock acquisition overhead and contention entirely for these simple cases, while still being race-free by construction (unlike a plain shared `var` with no synchronization at all).

## Bad

```zig
const std = @import("std");

const Stats = struct {
    request_count: u64 = 0, // no synchronization: a data race under concurrent increments

    fn recordRequest(self: *Stats) void {
        self.request_count += 1;
    }
};
```

## Good

```zig
const std = @import("std");

const Stats = struct {
    request_count: std.atomic.Value(u64) = std.atomic.Value(u64).init(0),

    fn recordRequest(self: *Stats) void {
        _ = self.request_count.fetchAdd(1, .monotonic);
    }

    fn total(self: *Stats) u64 {
        return self.request_count.load(.monotonic);
    }
};

test "atomic counter across threads" {
    var stats = Stats{};
    var threads: [8]std.Thread = undefined;
    for (&threads) |*t| {
        t.* = try std.Thread.spawn(.{}, Stats.recordRequest, .{&stats});
    }
    for (threads) |t| t.join();
    try std.testing.expectEqual(@as(u64, 8), stats.total());
}
```

## Choosing a Memory Order

`.monotonic` is sufficient for a simple counter with no other data depending on ordering relative to it. Operations establishing happens-before relationships with other memory (publishing a pointer, a flag guarding initialized data) need `.acquire`/`.release` — get this right by keeping atomics to simple, well-understood patterns rather than hand-rolling complex lock-free algorithms.

## See Also

- [conc-mutex-guard](conc-mutex-guard.md) - the mutex-based alternative for anything beyond a single value
- [conc-once-init](conc-once-init.md) - a related one-time-initialization primitive built on similar guarantees
- [conc-avoid-shared-mutable](conc-avoid-shared-mutable.md) - reducing shared state as the first line of defense
