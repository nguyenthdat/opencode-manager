# test-mock-dependency

> Inject fakes via `anytype`/comptime interfaces or an explicit vtable, rather than reaching for a mocking framework

## Why It Matters

Zig has no reflection-based mocking library (and no runtime metaprogramming to build one against arbitrary types). Testability instead comes from designing for it up front: accept dependencies as `anytype` (comptime duck typing) or as an explicit vtable (`api-vtable-dynamic`), and pass a lightweight hand-written fake in tests instead of the real implementation.

## Bad

```zig
const std = @import("std");

// Hard-wired to the real filesystem — there is no seam to substitute a
// fake in a test, so testing this function means touching real disk I/O.
fn loadGreeting() ![]const u8 {
    const file = try std.fs.cwd().openFile("greeting.txt", .{});
    defer file.close();
    var buf: [64]u8 = undefined;
    const n = try file.readAll(&buf);
    return buf[0..n];
}
```

## Good

```zig
const std = @import("std");

// Accepts anything with a matching `read` method — production code passes
// a real file; tests pass an in-memory fake.
fn loadGreeting(reader: anytype) ![]const u8 {
    var buf: [64]u8 = undefined;
    const n = try reader.read(&buf);
    return buf[0..n];
}

const FakeReader = struct {
    data: []const u8,

    fn read(self: FakeReader, buf: []u8) !usize {
        const n = @min(buf.len, self.data.len);
        @memcpy(buf[0..n], self.data[0..n]);
        return n;
    }
};

test "loadGreeting reads from any compatible reader" {
    const fake = FakeReader{ .data = "hello" };
    const result = try loadGreeting(fake);
    try std.testing.expectEqualStrings("hello", result);
}
```

## See Also

- [comptime-duck-interface](comptime-duck-interface.md) - the mechanism enabling this substitution
- [api-vtable-dynamic](api-vtable-dynamic.md) - the runtime-polymorphic alternative for heterogeneous fakes
- [test-arrange-act-assert](test-arrange-act-assert.md) - where fake setup fits into a test's structure
