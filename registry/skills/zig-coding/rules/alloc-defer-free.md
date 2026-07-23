# alloc-defer-free

> Pair every successful allocation with `defer allocator.free(...)` immediately, not "later"

## Why It Matters

Zig has no destructors and no borrow checker to force cleanup — the only enforcement mechanism is discipline plus `defer`. Writing the `free` on the line right after the `alloc` (via `defer`) means the pairing is visually obvious and survives future edits: someone adding an early `return` or `try` later in the function cannot accidentally skip the cleanup, because `defer` always runs on every exit path from that point forward.

## Bad

```zig
const std = @import("std");

fn readAndProcess(allocator: std.mem.Allocator, path: []const u8) !void {
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    if (data.len == 0) return error.EmptyFile; // leaks `data`!
    try process(data);
    allocator.free(data); // never reached on the early-return path
}
```

## Good

```zig
const std = @import("std");

fn readAndProcess(allocator: std.mem.Allocator, path: []const u8) !void {
    const data = try std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
    defer allocator.free(data); // runs on every exit path below this line

    if (data.len == 0) return error.EmptyFile;
    try process(data);
}
```

## Defer Runs in Reverse Order

Multiple `defer`s in one scope unwind last-registered-first — mirror acquisition order and cleanup happens in the correct reverse order automatically:

```zig
fn combine(allocator: std.mem.Allocator) ![]u8 {
    const a = try allocator.alloc(u8, 16);
    defer allocator.free(a);

    const b = try allocator.alloc(u8, 32);
    defer allocator.free(b); // b freed first, then a — matches nested acquisition
    // ...
}
```

## See Also

- [alloc-errdefer-cleanup](alloc-errdefer-cleanup.md) - the error-only counterpart to `defer`
- [alloc-free-order](alloc-free-order.md) - ordering rules when multiple resources depend on each other
- [anti-leak-missing-free](anti-leak-missing-free.md) - what happens when this pairing is skipped
