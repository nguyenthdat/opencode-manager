# alloc-free-order

> Free nested/owned members in the reverse order they were acquired

## Why It Matters

When a struct owns several allocated fields, or one resource depends on another (a file handle wrapping a buffer, a list of owned strings), tearing them down in reverse acquisition order avoids use-after-free and mirrors exactly how `defer` already unwinds a function scope. Getting this backwards in a hand-written `deinit` is a common source of subtle memory bugs that don't show up until a specific field ordering is exercised.

## Bad

```zig
const std = @import("std");

const Session = struct {
    allocator: std.mem.Allocator,
    token: []const u8,
    log_buffer: []u8, // holds a slice reference derived from `token`

    pub fn deinit(self: *Session) void {
        // Freeing token first, even though log_buffer's contents were
        // built from it — harmless here, but the wrong habit to build.
        self.allocator.free(self.token);
        self.allocator.free(self.log_buffer);
    }
};
```

## Good

```zig
const std = @import("std");

const Session = struct {
    allocator: std.mem.Allocator,
    token: []const u8,
    log_buffer: []u8,

    pub fn init(allocator: std.mem.Allocator, raw_token: []const u8) !Session {
        const token = try allocator.dupe(u8, raw_token);
        errdefer allocator.free(token);

        const log_buffer = try allocator.alloc(u8, 256);
        errdefer allocator.free(log_buffer);

        return .{ .allocator = allocator, .token = token, .log_buffer = log_buffer };
    }

    pub fn deinit(self: *Session) void {
        // Reverse of acquisition order: log_buffer (acquired second) freed first.
        self.allocator.free(self.log_buffer);
        self.allocator.free(self.token);
        self.* = undefined;
    }
};
```

## Why Reverse Order Matters More With Dependencies

If a later field's data was derived from (or references) an earlier field, freeing the earlier field first would leave the later one referencing freed memory during teardown — even if nothing reads it after, it's a trap for whoever edits `deinit` next. Keeping cleanup strictly reversed removes the need to reason about it case-by-case.

## See Also

- [alloc-defer-free](alloc-defer-free.md) - `defer`'s built-in LIFO ordering follows the same principle
- [alloc-errdefer-cleanup](alloc-errdefer-cleanup.md) - applying the same ordering on error-only paths
- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - the init/deinit convention this rule refines
