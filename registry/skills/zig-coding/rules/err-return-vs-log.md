# err-return-vs-log

> Return errors up the call stack; don't log-and-swallow deep in a helper function

## Why It Matters

A low-level helper rarely has enough context to decide what a failure *means* to the application — is a missing config file fatal, or does a sensible default apply? Logging and continuing inside a deep helper makes that policy decision on behalf of every caller, permanently, and hides the failure from code higher up that might have handled it better (retried, surfaced it to a user, fallen back to another source).

## Bad

```zig
const std = @import("std");

// This helper decides, unilaterally, that a read failure is not worth
// telling the caller about — the caller gets a zero-initialized Config
// and has no way to know it's a fallback rather than real data.
fn loadConfig(allocator: std.mem.Allocator, path: []const u8) Config {
    const data = std.fs.cwd().readFileAlloc(allocator, path, 1 << 20) catch |err| {
        std.log.err("failed to read config: {s}", .{@errorName(err)});
        return Config{};
    };
    defer allocator.free(data);
    return parseConfig(data) catch Config{};
}
```

## Good

```zig
const std = @import("std");

fn loadConfig(allocator: std.mem.Allocator, path: []const u8) !Config {
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    defer allocator.free(data);
    return parseConfig(data);
}

pub fn main() !void {
    const config = loadConfig(std.heap.page_allocator, "app.toml") catch |err| blk: {
        // The caller — with full context about what's acceptable here —
        // decides to log and fall back, rather than the helper deciding for it.
        std.log.warn("using defaults, could not load config: {s}", .{@errorName(err)});
        break :blk Config{};
    };
    _ = config;
}
```

## When Logging Locally Is Right

A genuine top-level boundary (a request handler that must always respond, a background job loop that must never crash the process) is exactly where logging-and-continuing belongs, because there's no further caller to hand the error to.

## See Also

- [err-catch-handle](err-catch-handle.md) - handling an error is fine; the question is at which layer
- [err-try-propagate](err-try-propagate.md) - the mechanism for returning errors upward
- [anti-ignore-error-union](anti-ignore-error-union.md) - the more severe version of this mistake: discarding silently
