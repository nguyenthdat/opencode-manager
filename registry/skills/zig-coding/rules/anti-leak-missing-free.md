# anti-leak-missing-free

> Don't leak allocations by forgetting the matching `defer allocator.free(...)`/`deinit()`

## Why It Matters

Every `alloc`/`create`/`dupe` call (and every type with its own `init`) creates an obligation to release that memory exactly once. Forgetting the corresponding `free`/`deinit` doesn't crash immediately — the program keeps running, slowly consuming more memory, until a long-running process eventually degrades or is killed by the OS. `std.testing.allocator` and `GeneralPurposeAllocator` exist specifically to catch this before it ships.

## Bad

```zig
const std = @import("std");

fn buildMessage(allocator: std.mem.Allocator, name: []const u8) ![]const u8 {
    const msg = try std.fmt.allocPrint(allocator, "Hello, {s}!", .{name});
    return msg; // caller must remember to free this — nothing enforces it
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit(); // will report the leak below on exit
    const msg = try buildMessage(gpa.allocator(), "world");
    std.debug.print("{s}\n", .{msg});
    // missing: gpa.allocator().free(msg);
}
```

## Good

```zig
const std = @import("std");

fn buildMessage(allocator: std.mem.Allocator, name: []const u8) ![]const u8 {
    return std.fmt.allocPrint(allocator, "Hello, {s}!", .{name});
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const msg = try buildMessage(gpa.allocator(), "world");
    defer gpa.allocator().free(msg); // paired immediately with the call above
    std.debug.print("{s}\n", .{msg});
}
```

## See Also

- [alloc-defer-free](alloc-defer-free.md) - the discipline that prevents this mistake
- [alloc-testing-allocator](alloc-testing-allocator.md) - catching this automatically in tests
- [alloc-gpa-debug](alloc-gpa-debug.md) - catching it in development builds outside of tests too
