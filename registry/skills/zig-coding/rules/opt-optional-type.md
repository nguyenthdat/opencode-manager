# opt-optional-type

> Use `?T` for values that may legitimately be absent, with no error information attached

## Why It Matters

`?T` is a first-class optional: either a valid `T` or `null`, tracked by the type system so every use site must handle both. It's the correct tool exactly when "no value" is a normal, expected outcome rather than a failure — a lookup that may miss, an optional configuration field — as opposed to `!T`, which is for outcomes that are failures with a reason attached.

## Bad

```zig
const std = @import("std");

// A sentinel value conflates "not found" with a real, valid id of 0 — an
// off-by-one bug or malicious input at id 0 becomes indistinguishable
// from "no match."
fn findIndex(haystack: []const u32, needle: u32) usize {
    for (haystack, 0..) |value, i| {
        if (value == needle) return i;
    }
    return 0; // 0 is ambiguous with a real match at index 0!
}
```

## Good

```zig
const std = @import("std");

fn findIndex(haystack: []const u32, needle: u32) ?usize {
    for (haystack, 0..) |value, i| {
        if (value == needle) return i;
    }
    return null;
}

test "optional index lookup" {
    const data = [_]u32{ 10, 20, 30 };
    try std.testing.expectEqual(@as(?usize, 1), findIndex(&data, 20));
    try std.testing.expectEqual(@as(?usize, null), findIndex(&data, 99));
}
```

## Optional Struct Fields

```zig
const Config = struct {
    host: []const u8,
    port: u16 = 8080,
    tls_cert_path: ?[]const u8 = null, // genuinely optional: TLS may not be configured
};
```

## See Also

- [opt-orelse-default](opt-orelse-default.md) - providing a fallback when the optional is `null`
- [opt-if-capture](opt-if-capture.md) - unwrapping an optional's payload safely
- [opt-null-vs-error](opt-null-vs-error.md) - the deciding question between `?T` and `!T`
