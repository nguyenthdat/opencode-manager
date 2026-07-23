# comptime-generic-struct

> Build generic data structures with a function that returns a `type`, parameterized by `comptime` arguments

## Why It Matters

A function whose return type is `type` — conventionally named with a capital letter, like `List` or `HashMap` — *is* Zig's generic type mechanism. Calling `List(u32)` evaluates the function at compile time and produces a distinct, fully concrete type, with all the same ergonomics (methods, fields) as a hand-written struct, but reusable across any element type.

## Bad

```zig
const std = @import("std");

// Hand-duplicated stack for each element type.
const IntStack = struct {
    items: std.ArrayListUnmanaged(i32) = .{},
    fn push(self: *IntStack, allocator: std.mem.Allocator, value: i32) !void {
        try self.items.append(allocator, value);
    }
};
const StringStack = struct {
    items: std.ArrayListUnmanaged([]const u8) = .{},
    fn push(self: *StringStack, allocator: std.mem.Allocator, value: []const u8) !void {
        try self.items.append(allocator, value);
    }
};
```

## Good

```zig
const std = @import("std");

fn Stack(comptime T: type) type {
    return struct {
        const Self = @This();
        items: std.ArrayListUnmanaged(T) = .{},

        pub fn push(self: *Self, allocator: std.mem.Allocator, value: T) !void {
            try self.items.append(allocator, value);
        }

        pub fn pop(self: *Self) ?T {
            return self.items.popOrNull();
        }

        pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
            self.items.deinit(allocator);
        }
    };
}

test "generic stack" {
    const allocator = std.testing.allocator;
    var stack: Stack(u32) = .{};
    defer stack.deinit(allocator);

    try stack.push(allocator, 1);
    try stack.push(allocator, 2);
    try std.testing.expectEqual(@as(?u32, 2), stack.pop());
}
```

## `Self` via `@This()`

Inside a generic struct returned this way, `const Self = @This();` gives a stable name for the concrete instantiated type — used consistently in method signatures (`self: *Self`) regardless of which `T` produced it.

## See Also

- [comptime-generic-param](comptime-generic-param.md) - the simpler function-level version of this technique
- [comptime-avoid-bloat](comptime-avoid-bloat.md) - the cost of instantiating many distinct generic types
- [api-struct-methods](api-struct-methods.md) - method conventions that apply equally to generic structs
