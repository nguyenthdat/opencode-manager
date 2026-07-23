# test-testing-allocator-leak

> Use `std.testing.allocator` in every test that allocates, so leaks fail the test automatically

## Why It Matters

`std.testing.allocator` wires a leak-detecting `GeneralPurposeAllocator` into the test runner: any allocation not freed by the time the test ends fails that specific test with a report identifying the leak. This turns "did I forget a `free`/`deinit`?" from a manual code-review question into an automated, per-test guarantee.

## Bad

```zig
const std = @import("std");

test "builds a greeting" {
    // page_allocator won't ever report this as a leak, hiding a real bug
    // in the function under test (or in the test itself).
    const msg = try std.fmt.allocPrint(std.heap.page_allocator, "hi {s}", .{"there"});
    try std.testing.expectEqualStrings("hi there", msg);
}
```

## Good

```zig
const std = @import("std");

test "builds a greeting" {
    const msg = try std.fmt.allocPrint(std.testing.allocator, "hi {s}", .{"there"});
    defer std.testing.allocator.free(msg);
    try std.testing.expectEqualStrings("hi there", msg);
}
```

## Testing a Type That Owns Its Own Allocator

```zig
const Registry = @import("registry.zig").Registry;

test "Registry.deinit frees all entries" {
    var registry = Registry.init(std.testing.allocator);
    defer registry.deinit(); // if this misses a free, the test fails with a leak report

    try registry.add("alice");
    try registry.add("bob");
}
```

## See Also

- [alloc-testing-allocator](alloc-testing-allocator.md) - the allocator-category framing of this same practice
- [alloc-defer-free](alloc-defer-free.md) - the discipline this allocator verifies automatically
- [test-arrange-act-assert](test-arrange-act-assert.md) - where allocator setup fits into a test's structure
