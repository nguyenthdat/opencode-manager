# doc-examples-runnable

> Include runnable usage examples in doc comments, mirrored by an actual test

## Why It Matters

A code example inside a doc comment is only as trustworthy as the last time someone actually ran it. Pairing every non-trivial example with a corresponding `test` block (see `test-doc-comment-example`) means the example is verified on every `zig build test` run, and any behavior change that breaks the example is caught immediately instead of silently making the docs wrong.

## Bad

```zig
const std = @import("std");

/// Joins a slice of words with a separator.
/// Usage: join(", ", &.{"a", "b", "c"}) -> "a, b, c"
pub fn join(allocator: std.mem.Allocator, sep: []const u8, words: []const []const u8) ![]u8 {
    return std.mem.join(allocator, sep, words);
}
// The example is prose, never actually executed — it can silently drift
// out of sync with real behavior.
```

## Good

```zig
const std = @import("std");

/// Joins a slice of words with a separator, allocating the result.
///
/// ```
/// const result = try join(allocator, ", ", &.{ "a", "b", "c" });
/// // result == "a, b, c"
/// ```
pub fn join(allocator: std.mem.Allocator, sep: []const u8, words: []const []const u8) ![]u8 {
    return std.mem.join(allocator, sep, words);
}

test "join doc example" {
    const result = try join(std.testing.allocator, ", ", &.{ "a", "b", "c" });
    defer std.testing.allocator.free(result);
    try std.testing.expectEqualStrings("a, b, c", result);
}
```

## See Also

- [test-doc-comment-example](test-doc-comment-example.md) - the testing-category rule for this exact pairing
- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc comment convention examples live inside
- [doc-allocator-ownership](doc-allocator-ownership.md) - documenting ownership alongside a runnable example
