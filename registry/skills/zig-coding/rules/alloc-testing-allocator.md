# alloc-testing-allocator

> Use `std.testing.allocator` in tests so leaks and misuse fail the test suite automatically

## Why It Matters

`std.testing.allocator` is a `GeneralPurposeAllocator` wired into the test runner: if a test allocates memory and never frees it, `zig test` reports the leak and fails, pinpointing the exact allocation. Using `page_allocator` or a raw arena in tests hides this feedback entirely, letting leaks slip through code review.

## Bad

```zig
const std = @import("std");
const testing = std.testing;

test "parses a name" {
    // No leak detection — a forgotten free here is silently invisible.
    const name = try std.fmt.allocPrint(std.heap.page_allocator, "{s}", .{"alice"});
    try testing.expect(std.mem.eql(u8, name, "alice"));
    // missing free — page_allocator won't complain.
}
```

## Good

```zig
const std = @import("std");
const testing = std.testing;

test "parses a name" {
    const name = try std.fmt.allocPrint(testing.allocator, "{s}", .{"alice"});
    defer testing.allocator.free(name);

    try testing.expect(std.mem.eql(u8, name, "alice"));
}
// Forget the `defer testing.allocator.free(name)` above and `zig test`
// fails the test with a leak report pointing at the allocation site.
```

## Passing the Testing Allocator Into the Code Under Test

Since your production code should already accept `std.mem.Allocator` as a parameter (see `alloc-explicit-param`), tests exercise the real allocation path for free:

```zig
const MyParser = @import("parser.zig").Parser;

test "parser frees all intermediate buffers" {
    var parser = MyParser.init(testing.allocator);
    defer parser.deinit();

    const result = try parser.parse("input data");
    defer testing.allocator.free(result);

    try testing.expect(result.len > 0);
}
```

## See Also

- [alloc-gpa-debug](alloc-gpa-debug.md) - the same leak-detecting allocator family used in development
- [test-testing-allocator-leak](test-testing-allocator-leak.md) - the testing-category rule for this same practice
- [alloc-explicit-param](alloc-explicit-param.md) - why production code must accept an allocator to make this possible
