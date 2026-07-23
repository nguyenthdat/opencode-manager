# alloc-no-global

> Avoid global or hidden allocator state; thread the allocator through the call graph instead

## Why It Matters

A global allocator variable reintroduces the exact problem explicit allocators are meant to solve: callers can no longer choose or scope memory strategy, tests can't isolate allocations per-case, and the same code can't run twice concurrently with different allocators (e.g. one arena per request). Global allocator state also makes libraries unusable in hosts that provide their own allocator (game engines, plugin hosts, WASM runtimes).

## Bad

```zig
const std = @import("std");

// Module-level global — every caller is now stuck with this allocator.
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
const allocator = gpa.allocator();

pub const Cache = struct {
    entries: std.StringHashMap([]const u8),

    pub fn init() Cache {
        return .{ .entries = std.StringHashMap([]const u8).init(allocator) };
    }
};
```

## Good

```zig
const std = @import("std");

pub const Cache = struct {
    entries: std.StringHashMap([]const u8),

    pub fn init(allocator: std.mem.Allocator) Cache {
        return .{ .entries = std.StringHashMap([]const u8).init(allocator) };
    }

    pub fn deinit(self: *Cache) void {
        self.entries.deinit();
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    var cache = Cache.init(gpa.allocator());
    defer cache.deinit();
}
```

## The One Reasonable Exception

`std.heap.page_allocator` and `std.heap.c_allocator` are stateless singletons exposed *as* `std.mem.Allocator` values — using them is fine because they are still passed explicitly, not read from a hidden global:

```zig
pub fn main() !void {
    // Explicit choice, still passed as a normal argument at the call site.
    try run(std.heap.page_allocator);
}
```

## See Also

- [alloc-explicit-param](alloc-explicit-param.md) - pass the allocator as a normal function argument
- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - store the allocator on the struct that owns it
- [anti-global-allocator](anti-global-allocator.md) - the anti-pattern write-up of this same mistake
