# alloc-gpa-debug

> Use `GeneralPurposeAllocator` in debug and development builds to catch leaks and misuse

## Why It Matters

`std.heap.GeneralPurposeAllocator` (GPA) is a safety-focused allocator: it detects double-frees, use-after-free, and — critically — reports every leaked allocation with a stack trace when `deinit()` runs. Reaching for it by default in `Debug` builds turns a whole class of manual-memory bugs into a hard failure at development time instead of a customer-facing crash.

## Bad

```zig
const std = @import("std");

pub fn main() !void {
    // page_allocator gives no leak detection, no double-free detection.
    const allocator = std.heap.page_allocator;
    const buf = try allocator.alloc(u8, 1024);
    // Forgot to free — nothing will ever tell you.
    _ = buf;
}
```

## Good

```zig
const std = @import("std");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer {
        const leaked = gpa.deinit();
        if (leaked == .leak) @panic("memory leak detected");
    }
    const allocator = gpa.allocator();

    const buf = try allocator.alloc(u8, 1024);
    defer allocator.free(buf);

    try run(allocator, buf);
}

fn run(allocator: std.mem.Allocator, buf: []u8) !void {
    _ = allocator;
    @memset(buf, 0);
}
```

## Configuring Safety vs. Speed

```zig
// Maximum safety checks (default), best for tests and debug builds.
var gpa_safe = std.heap.GeneralPurposeAllocator(.{}){};

// Disable safety checks but keep leak detection for a faster debug loop.
var gpa_fast = std.heap.GeneralPurposeAllocator(.{ .safety = false }){};

// Track allocation stack traces for precise leak reports (slower).
var gpa_verbose = std.heap.GeneralPurposeAllocator(.{ .stack_trace_frames = 8 }){};
```

Ship `ReleaseFast`/`ReleaseSmall` builds with `std.heap.smp_allocator` or `std.heap.c_allocator` instead — GPA's bookkeeping overhead is meant for development, not production hot paths.

## See Also

- [alloc-arena-scoped](alloc-arena-scoped.md) - a faster allocator for batch/request-scoped work
- [lint-debug-default](lint-debug-default.md) - use Debug mode by default while developing
- [anti-leak-missing-free](anti-leak-missing-free.md) - the leak GPA is designed to catch
