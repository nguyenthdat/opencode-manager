# doc-allocator-ownership

> Document allocator and ownership/lifetime contracts explicitly — the compiler does not enforce them

## Why It Matters

Unlike a borrow checker, Zig's compiler has no idea whether a returned slice is owned by the caller (who must free it) or borrowed from an argument (who must not free it), or which allocator a caller should use to free it. That information exists only in the function's doc comment (or a very strong, consistent project-wide convention) — omitting it forces every caller to guess, risking a double-free, a leak, or a free with the wrong allocator.

## Bad

```zig
const std = @import("std");

/// Returns the uppercase version of a string.
pub fn shout(allocator: std.mem.Allocator, input: []const u8) ![]u8 {
    const result = try allocator.alloc(u8, input.len);
    for (input, 0..) |c, i| result[i] = std.ascii.toUpper(c);
    return result;
}
// Nothing here tells a caller: is the returned slice newly allocated (must
// free), or could it sometimes alias `input` (must not free)?
```

## Good

```zig
const std = @import("std");

/// Returns a newly allocated uppercase copy of `input`.
///
/// The caller owns the returned slice and must free it with the same
/// `allocator` passed in, e.g. `allocator.free(result)`.
pub fn shout(allocator: std.mem.Allocator, input: []const u8) ![]u8 {
    const result = try allocator.alloc(u8, input.len);
    for (input, 0..) |c, i| result[i] = std.ascii.toUpper(c);
    return result;
}

test "shout ownership" {
    const result = try shout(std.testing.allocator, "hi");
    defer std.testing.allocator.free(result); // contract stated above, honored here
    try std.testing.expectEqualStrings("HI", result);
}
```

## Document the "Borrowed, Don't Free" Case Just as Explicitly

```zig
/// Returns a view into `input` with surrounding whitespace removed.
/// The returned slice borrows from `input` and must not outlive it,
/// and must never be passed to `allocator.free`.
pub fn trimmed(input: []const u8) []const u8 {
    return std.mem.trim(u8, input, " \t\n");
}
```

## See Also

- [alloc-defer-free](alloc-defer-free.md) - the caller-side discipline this documentation enables
- [doc-doc-comment-slash3](doc-doc-comment-slash3.md) - the doc-comment mechanism used here
- [alloc-explicit-param](alloc-explicit-param.md) - the allocator parameter whose contract is being documented
