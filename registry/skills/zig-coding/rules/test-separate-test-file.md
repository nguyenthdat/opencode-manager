# test-separate-test-file

> Keep test-only files close to the implementation, and reserve separate test files for larger integration scenarios

## Why It Matters

Colocated `test` blocks (`test-builtin-test-block`) are right for unit-level tests of a single file's logic. But some scenarios genuinely don't belong inside the implementation file — integration tests that exercise several modules together, tests requiring heavier fixtures, or a large suite that would dominate an otherwise-small implementation file. For those, a clearly named separate test file (imported from the test root) keeps things organized without losing discoverability.

## Bad

```zig
// server.zig — a small implementation file bloated with an entire
// integration-test suite that conceptually belongs at a higher level,
// making the actual server logic hard to find.
const std = @import("std");

pub fn handleRequest(path: []const u8) []const u8 {
    return path;
}

test "full request/response cycle across three modules" { /* ... */ }
test "concurrent requests don't corrupt shared state" { /* ... */ }
test "graceful shutdown drains in-flight requests" { /* ... */ }
// ... 20 more integration-level tests ...
```

## Good

```zig
// server.zig — small, focused, with its own small unit tests.
const std = @import("std");

pub fn handleRequest(path: []const u8) []const u8 {
    return path;
}

test "handleRequest returns the path unchanged" {
    try std.testing.expectEqualStrings("/health", handleRequest("/health"));
}
```

```zig
// tests/integration_server_test.zig — larger, cross-module scenarios live here.
const std = @import("std");
const server = @import("server");

test "full request/response cycle across three modules" {
    // ...
}
```

## See Also

- [test-builtin-test-block](test-builtin-test-block.md) - the default: colocated unit tests
- [proj-package-boundaries](proj-package-boundaries.md) - the module boundaries integration tests exercise
- [test-refAllDecls](test-refAllDecls.md) - ensuring separate test files are actually discovered
