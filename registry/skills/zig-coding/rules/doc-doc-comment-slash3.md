# doc-doc-comment-slash3

> Use `///` doc comments on public declarations, describing behavior rather than restating the signature

## Why It Matters

`///` immediately above a declaration is a real, tool-recognized doc comment (surfaced by editors and any future documentation generator) — distinct from an ordinary `//` comment. A doc comment that only restates the type signature in English adds nothing; one that explains behavior, edge cases, and units of measurement actually helps a caller who hasn't read the implementation.

## Bad

```zig
const std = @import("std");

/// Takes a u32 and returns a u32.
pub fn ttlSeconds(minutes: u32) u32 {
    return minutes * 60;
}
```

## Good

```zig
const std = @import("std");

/// Converts a duration from minutes to seconds for use as a cache TTL.
/// Saturates at `std.math.maxInt(u32)` instead of overflowing on very
/// large inputs.
pub fn ttlSeconds(minutes: u32) u32 {
    return std.math.mul(u32, minutes, 60) catch std.math.maxInt(u32);
}

test "ttlSeconds converts minutes to seconds" {
    try std.testing.expectEqual(@as(u32, 120), ttlSeconds(2));
}
```

## Doc Comments Must Immediately Precede the Declaration

A blank line or unrelated code between a `///` block and the declaration it documents detaches it — the compiler (and readers) will not associate the two.

## See Also

- [doc-module-doc-slash2](doc-module-doc-slash2.md) - the file-level counterpart to per-declaration doc comments
- [doc-error-set-document](doc-error-set-document.md) - documenting the error sets a function can return
- [doc-public-api-only](doc-public-api-only.md) - deciding which declarations warrant a full doc comment
