# perf-slice-over-copy

> Use slice-based APIs to avoid unnecessary copies of large data

## Why It Matters

Passing and returning slices (address + length) is O(1) regardless of how much data they describe; copying the underlying bytes is O(n) and, for large buffers, can dominate a function's actual runtime cost. Structuring APIs to hand back a view into existing memory — rather than a fresh copy — whenever the caller doesn't need independent ownership keeps large-data operations cheap.

## Bad

```zig
const std = @import("std");

// Allocates and copies the entire buffer just to describe a sub-range of
// it — the caller likely only needed a view, not a duplicate.
fn firstLine(allocator: std.mem.Allocator, text: []const u8) ![]u8 {
    const end = std.mem.indexOfScalar(u8, text, '\n') orelse text.len;
    const copy = try allocator.alloc(u8, end);
    @memcpy(copy, text[0..end]);
    return copy;
}
```

## Good

```zig
const std = @import("std");

fn firstLine(text: []const u8) []const u8 {
    const end = std.mem.indexOfScalar(u8, text, '\n') orelse text.len;
    return text[0..end]; // a view into the existing buffer, no allocation
}

test "slicing avoids a copy" {
    const text = "hello\nworld";
    try std.testing.expectEqualStrings("hello", firstLine(text));
}
```

## When a Copy Is Actually Needed

If the returned data must outlive `text` (see `slice-avoid-copy`), copy explicitly and document the ownership transfer — the point isn't "never copy," it's "don't copy when a slice would do."

## See Also

- [slice-avoid-copy](slice-avoid-copy.md) - the general API-design framing of this same trade-off
- [slice-prefer-over-array-ptr](slice-prefer-over-array-ptr.md) - the slice type this rule builds on
- [doc-allocator-ownership](doc-allocator-ownership.md) - documenting whether a returned slice borrows or owns
