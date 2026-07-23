# anti-arena-in-long-lived

> Don't use an arena allocator for data with an unbounded or long-running lifetime

## Why It Matters

An arena never frees individual allocations — everything it's given stays resident until the entire arena is torn down. Using one to back a server-wide cache, a document model edited over an entire session, or any other unboundedly-growing, long-lived structure turns every allocation into a permanent one for the life of the process: a slow-motion memory leak that looks fine in short-lived tests and only shows up as steadily climbing memory usage in production.

## Bad

```zig
const std = @import("std");

const AppState = struct {
    arena: std.heap.ArenaAllocator,

    fn init(gpa: std.mem.Allocator) AppState {
        return .{ .arena = std.heap.ArenaAllocator.init(gpa) };
    }

    // Called on every request for the lifetime of a long-running server —
    // nothing here is ever actually freed until the whole process exits.
    fn cacheResult(self: *AppState, key: []const u8, value: []const u8) !void {
        _ = try self.arena.allocator().dupe(u8, key);
        _ = try self.arena.allocator().dupe(u8, value);
    }
};
```

## Good

```zig
const std = @import("std");

const AppState = struct {
    gpa: std.mem.Allocator,
    cache: std.StringHashMap([]const u8),

    fn init(gpa: std.mem.Allocator) AppState {
        return .{ .gpa = gpa, .cache = std.StringHashMap([]const u8).init(gpa) };
    }

    fn cacheResult(self: *AppState, key: []const u8, value: []const u8) !void {
        const owned_key = try self.gpa.dupe(u8, key);
        errdefer self.gpa.free(owned_key);
        const owned_value = try self.gpa.dupe(u8, value);
        try self.cache.put(owned_key, owned_value); // individually freeable, evictable
    }
};
```

## See Also

- [alloc-arena-scoped](alloc-arena-scoped.md) - the full rule this anti-pattern violates; arenas are for bounded, scoped work
- [alloc-gpa-debug](alloc-gpa-debug.md) - a leak-detecting allocator that would surface this exact mistake in tests
- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - the individually-freeable pattern used in the fix above
