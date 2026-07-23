# alloc-arena-scoped

> Use `ArenaAllocator` for request-scoped or batch-scoped allocations that all die together

## Why It Matters

An arena allocates from an underlying allocator in growing chunks and frees everything at once when `deinit()` runs — there is no per-allocation bookkeeping and no need to track individual frees. This is ideal whenever a group of allocations shares one lifetime: a single HTTP request, one parse pass, one frame of a game loop. It trades slightly higher peak memory (nothing is freed until the whole arena goes away) for dramatically simpler cleanup and faster allocation.

## Bad

```zig
const std = @import("std");

// Freeing every intermediate parse allocation individually is tedious and
// error-prone — miss one `defer` and you leak.
fn parseRequest(allocator: std.mem.Allocator, raw: []const u8) !Request {
    const headers = try parseHeaders(allocator, raw);
    defer allocator.free(headers); // wait, we need headers in the result...
    const body = try parseBody(allocator, raw);
    return .{ .headers = headers, .body = body };
}
```

## Good

```zig
const std = @import("std");

fn handleRequest(gpa: std.mem.Allocator, raw: []const u8) !Response {
    var arena_state = std.heap.ArenaAllocator.init(gpa);
    defer arena_state.deinit(); // frees every allocation made through `arena` at once
    const arena = arena_state.allocator();

    const headers = try parseHeaders(arena, raw);
    const body = try parseBody(arena, raw);
    const parsed = Request{ .headers = headers, .body = body };

    // Copy only what must outlive the arena using the caller's allocator.
    const response = try buildResponse(gpa, parsed);
    return response;
}
```

## Resetting Instead of Reallocating

For a long-running loop that processes many independent batches, reuse one arena and reset it between iterations instead of creating a new one each time:

```zig
var arena_state = std.heap.ArenaAllocator.init(gpa);
defer arena_state.deinit();

while (nextBatch()) |batch| {
    defer _ = arena_state.reset(.retain_capacity); // keep the backing pages, drop the allocations
    try processBatch(arena_state.allocator(), batch);
}
```

## When Not to Use an Arena

Don't wrap long-lived, unboundedly-growing state (a server-wide cache, a document model edited over hours) in an arena — memory only grows until the whole arena is torn down, so long-lived arenas become leaks in slow motion. See `anti-arena-in-long-lived`.

## See Also

- [alloc-fixed-buffer](alloc-fixed-buffer.md) - a stack-based alternative with zero heap traffic
- [alloc-defer-free](alloc-defer-free.md) - the discipline arenas let you skip for grouped allocations
- [anti-arena-in-long-lived](anti-arena-in-long-lived.md) - the failure mode of arenas used for unbounded lifetimes
