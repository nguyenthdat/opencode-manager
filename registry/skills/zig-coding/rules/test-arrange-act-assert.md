# test-arrange-act-assert

> Structure test bodies as arrange, act, assert — in that order, visually separated

## Why It Matters

A test that interleaves setup, the operation under test, and assertions throughout its body is harder to scan and harder to modify safely. Structuring every test the same way — set up inputs, perform the one operation being tested, then check the outcome — makes tests predictable to read and easy to diff when they change.

## Bad

```zig
const std = @import("std");

test "user registration" {
    var registry = Registry.init(std.testing.allocator);
    try std.testing.expect(registry.count() == 0); // assertion mixed into setup
    defer registry.deinit();
    try registry.add("alice");
    try std.testing.expect(registry.count() == 1);
    try registry.add("bob"); // more "act" after already asserting
    try std.testing.expect(registry.count() == 2);
}

const Registry = struct {
    allocator: std.mem.Allocator,
    names: std.ArrayListUnmanaged([]const u8) = .{},

    fn init(allocator: std.mem.Allocator) Registry {
        return .{ .allocator = allocator };
    }
    fn deinit(self: *Registry) void {
        self.names.deinit(self.allocator);
    }
    fn add(self: *Registry, name: []const u8) !void {
        try self.names.append(self.allocator, name);
    }
    fn count(self: Registry) usize {
        return self.names.items.len;
    }
};
```

## Good

```zig
const std = @import("std");

test "adding two users brings the count to two" {
    // Arrange
    var registry = Registry.init(std.testing.allocator);
    defer registry.deinit();

    // Act
    try registry.add("alice");
    try registry.add("bob");

    // Assert
    try std.testing.expectEqual(@as(usize, 2), registry.count());
}

const Registry = struct {
    allocator: std.mem.Allocator,
    names: std.ArrayListUnmanaged([]const u8) = .{},

    fn init(allocator: std.mem.Allocator) Registry {
        return .{ .allocator = allocator };
    }
    fn deinit(self: *Registry) void {
        self.names.deinit(self.allocator);
    }
    fn add(self: *Registry, name: []const u8) !void {
        try self.names.append(self.allocator, name);
    }
    fn count(self: Registry) usize {
        return self.names.items.len;
    }
};
```

## See Also

- [test-std-testing-expect](test-std-testing-expect.md) - the assertion helpers used in the "assert" step
- [test-testing-allocator-leak](test-testing-allocator-leak.md) - allocator setup as part of "arrange"
- [name-test-description](name-test-description.md) - naming the test to match what "act" and "assert" verify
