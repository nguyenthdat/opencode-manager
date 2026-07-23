# alloc-init-deinit-pair

> Store the allocator a struct was built with, and always pair `init` with `deinit`

## Why It Matters

Types that own heap memory (lists, hash maps, trees) need to free that memory using the *same* allocator that created it. The idiomatic Zig pattern is to accept the allocator once in `init`, keep it on the struct, and expose a matching `deinit` that releases everything using that stored allocator — so callers never have to remember or re-supply which allocator to free with.

## Bad

```zig
const std = @import("std");

const Registry = struct {
    names: std.ArrayList([]const u8),

    fn init() Registry {
        // No allocator stored — deinit has no way to know what to free with.
        return .{ .names = undefined };
    }
};
```

## Good

```zig
const std = @import("std");

const Registry = struct {
    allocator: std.mem.Allocator,
    names: std.ArrayList([]const u8),

    pub fn init(allocator: std.mem.Allocator) Registry {
        return .{
            .allocator = allocator,
            .names = std.ArrayList([]const u8).init(allocator),
        };
    }

    pub fn deinit(self: *Registry) void {
        for (self.names.items) |name| self.allocator.free(name);
        self.names.deinit();
        self.* = undefined; // catch use-after-deinit in debug builds
    }

    pub fn add(self: *Registry, name: []const u8) !void {
        const owned = try self.allocator.dupe(u8, name);
        errdefer self.allocator.free(owned);
        try self.names.append(owned);
    }
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    var registry = Registry.init(gpa.allocator());
    defer registry.deinit();

    try registry.add("alice");
}
```

## Reset Pattern for Reusable Containers

Some standard library containers (`std.ArrayList`) intentionally do *not* store the allocator on the struct (the "unmanaged" variants) and instead take it on every mutating call — that's a deliberate size/flexibility trade-off, not an inconsistency. Follow whichever convention the container you're wrapping already uses, and document it.

## See Also

- [alloc-explicit-param](alloc-explicit-param.md) - the parameter convention `init` follows
- [alloc-arraylist-managed](alloc-arraylist-managed.md) - managed vs. unmanaged container allocator storage
- [alloc-free-order](alloc-free-order.md) - freeing nested owned fields in the right order inside `deinit`
