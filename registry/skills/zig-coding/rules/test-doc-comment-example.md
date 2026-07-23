# test-doc-comment-example

> Keep doc-comment examples close to real, runnable code so they don't silently drift out of date

## Why It Matters

A usage example inside a `///` doc comment is only trustworthy if it actually compiles and does what it claims — an example that's just prose describing behavior, disconnected from any real test, will quietly go stale the first time the function's behavior changes and nobody remembers to update the comment. Mirroring the doc example as an actual `test` block (even a small one) keeps the two in sync by construction.

## Bad

```zig
const std = @import("std");

/// Trims leading and trailing whitespace.
/// Example: trim("  hi  ") returns "hi"
/// (nothing actually verifies this claim stays true)
pub fn trim(s: []const u8) []const u8 {
    return std.mem.trim(u8, s, " ");
}
```

## Good

```zig
const std = @import("std");

/// Trims leading and trailing whitespace.
///
/// ```
/// try std.testing.expectEqualStrings("hi", trim("  hi  "));
/// ```
pub fn trim(s: []const u8) []const u8 {
    return std.mem.trim(u8, s, " ");
}

test "trim doc example" {
    try std.testing.expectEqualStrings("hi", trim("  hi  "));
}
```

## See Also

- [doc-examples-runnable](doc-examples-runnable.md) - the documentation-category framing of this same practice
- [test-builtin-test-block](test-builtin-test-block.md) - the mechanism backing the mirrored test
- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc comment convention this example lives inside
