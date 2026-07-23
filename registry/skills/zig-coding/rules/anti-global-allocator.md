# anti-global-allocator

> Don't reach for a global allocator variable instead of threading one through explicitly

## Why It Matters

A module-level `var allocator = ...` reintroduces hidden, ambient state that Zig's explicit-allocator design otherwise avoids — it locks every consumer into one allocator choice, breaks testability (no way to substitute `std.testing.allocator` per test), and makes the code impossible to run twice concurrently with different allocation strategies (e.g. a per-request arena).

## Bad

```zig
const std = @import("std");

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const global_allocator = gpa.allocator(); // hidden dependency every function below relies on

pub fn loadData(path: []const u8) ![]u8 {
    return std.fs.cwd().readFileAlloc(global_allocator, path, 1 << 20);
}
```

## Good

```zig
const std = @import("std");

pub fn loadData(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    return std.fs.cwd().readFileAlloc(allocator, path, 1 << 20);
}

test "loadData with the testing allocator" {
    // Only possible because the allocator is a normal parameter.
    _ = loadData; // (would call with std.testing.allocator and a real path)
}
```

## See Also

- [alloc-no-global](alloc-no-global.md) - the full rule this anti-pattern violates
- [alloc-explicit-param](alloc-explicit-param.md) - the correct, explicit-parameter alternative
- [alloc-testing-allocator](alloc-testing-allocator.md) - the testability this anti-pattern breaks
