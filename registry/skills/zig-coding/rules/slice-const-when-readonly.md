# slice-const-when-readonly

> Use `[]const T` for slice parameters the function only reads

## Why It Matters

`[]const T` documents, at the type level, that a function will not write through the slice — the compiler enforces it, so callers can pass an immutable view (a `[]const u8` string literal, a slice of a `const` array) without a cast, and readers of the signature immediately know the function has no mutation side effect on the data.

## Bad

```zig
const std = @import("std");

// `[]u8` claims the right to mutate, even though the function only reads —
// this needlessly rejects callers holding a genuinely const slice, and
// misleads readers about the function's effects.
fn containsUppercase(text: []u8) bool {
    for (text) |c| {
        if (std.ascii.isUpper(c)) return true;
    }
    return false;
}
```

## Good

```zig
const std = @import("std");

fn containsUppercase(text: []const u8) bool {
    for (text) |c| {
        if (std.ascii.isUpper(c)) return true;
    }
    return false;
}

test "const slice parameter accepts a string literal directly" {
    try std.testing.expect(containsUppercase("Hello"));
    try std.testing.expect(!containsUppercase("hello"));
}
```

## `[]const T` Also Documents Intent for Mutable Backing Storage

Even when the caller's actual backing array is mutable, passing it as `[]const T` to a read-only function is a deliberate, zero-cost narrowing — Zig implicitly coerces `[]T` to `[]const T`, never the reverse:

```zig
var buffer = [_]u8{ 'H', 'i' };
_ = containsUppercase(&buffer); // []u8 coerces to []const u8 automatically
```

## See Also

- [slice-prefer-over-array-ptr](slice-prefer-over-array-ptr.md) - the general case for accepting slices in APIs
- [own-borrow-over-clone](../rust-coding/rules/own-borrow-over-clone.md) - the analogous Rust idiom, for comparison
- [api-explicit-fallibility](api-explicit-fallibility.md) - honest signatures as a broader design principle
