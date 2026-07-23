# api-error-union-in-init

> Surface allocation/setup failures from `init` through an error union, never through a panic

## Why It Matters

Construction is exactly where allocation is most likely to fail (the first `alloc` call for a new object), and an `init` that panics on `error.OutOfMemory` instead of returning `!Self` forces every caller into "crash the whole program if memory is momentarily tight" — even when the caller would have preferred to retry, free something else, or degrade gracefully.

## Bad

```zig
const std = @import("std");

const Buffer = struct {
    data: []u8,

    // Panics on allocation failure — callers have no way to recover.
    fn init(allocator: std.mem.Allocator, size: usize) Buffer {
        const data = allocator.alloc(u8, size) catch @panic("out of memory");
        return .{ .data = data };
    }
};
```

## Good

```zig
const std = @import("std");

const Buffer = struct {
    allocator: std.mem.Allocator,
    data: []u8,

    pub fn init(allocator: std.mem.Allocator, size: usize) !Buffer {
        const data = try allocator.alloc(u8, size);
        return .{ .allocator = allocator, .data = data };
    }

    pub fn deinit(self: *Buffer) void {
        self.allocator.free(self.data);
    }
};

test "init surfaces allocation failure" {
    var buffer = try Buffer.init(std.testing.allocator, 128);
    defer buffer.deinit();
    try std.testing.expectEqual(@as(usize, 128), buffer.data.len);
}
```

## Multi-Step `init` With Partial Failure

Combine with `errdefer` so a failure partway through a multi-allocation `init` cleans up what already succeeded (see `alloc-errdefer-cleanup`):

```zig
const Session = struct {
    token: []u8,
    log: []u8,

    pub fn init(allocator: std.mem.Allocator) !Session {
        const token = try allocator.alloc(u8, 32);
        errdefer allocator.free(token);
        const log = try allocator.alloc(u8, 256);
        return .{ .token = token, .log = log };
    }
};
```

## See Also

- [alloc-errdefer-cleanup](alloc-errdefer-cleanup.md) - cleaning up partial construction on a later failure
- [api-init-deinit-convention](api-init-deinit-convention.md) - the broader init/deinit convention this refines
- [anti-panic-for-recoverable](anti-panic-for-recoverable.md) - the anti-pattern of panicking on recoverable failure
