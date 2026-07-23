# api-init-deinit-convention

> Follow the `init`/`deinit` convention for any type that owns a resource

## Why It Matters

Zig has no constructors, destructors, or RAII — cleanup only happens if someone calls it. The standard library's convention is that any resource-owning type exposes `init(...)` to construct it and `deinit(self: *Self, ...)` to release everything it owns; following this convention consistently means every caller instinctively knows to look for (and call) `deinit`, and tools like `defer` pair naturally with it.

## Bad

```zig
const std = @import("std");

const Parser = struct {
    allocator: std.mem.Allocator,
    buffer: []u8,

    // No init/deinit — callers have to guess how to construct and clean
    // this up, and different call sites will invent different conventions.
    fn create(allocator: std.mem.Allocator, size: usize) !Parser {
        return .{ .allocator = allocator, .buffer = try allocator.alloc(u8, size) };
    }
    fn destroy(self: Parser) void {
        self.allocator.free(self.buffer);
    }
};
```

## Good

```zig
const std = @import("std");

const Parser = struct {
    allocator: std.mem.Allocator,
    buffer: []u8,

    pub fn init(allocator: std.mem.Allocator, size: usize) !Parser {
        return .{ .allocator = allocator, .buffer = try allocator.alloc(u8, size) };
    }

    pub fn deinit(self: *Parser) void {
        self.allocator.free(self.buffer);
        self.* = undefined;
    }
};

test "init/deinit convention" {
    var parser = try Parser.init(std.testing.allocator, 64);
    defer parser.deinit();
    try std.testing.expectEqual(@as(usize, 64), parser.buffer.len);
}
```

## `deinit` Takes `*Self`, Not `Self`

By convention `deinit` takes a pointer receiver even if it doesn't strictly need to mutate anything, because setting `self.* = undefined` after freeing (to catch accidental use-after-deinit in debug builds) requires a pointer.

## See Also

- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - storing the allocator as part of this same convention
- [api-error-union-in-init](api-error-union-in-init.md) - surfacing allocation failure from `init` itself
- [alloc-free-order](alloc-free-order.md) - ordering cleanup correctly inside `deinit`
