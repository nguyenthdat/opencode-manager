# slice-string-as-u8

> Treat strings as `[]const u8` slices — there is no separate `String` type

## Why It Matters

Zig has no built-in `String` type; a string is simply a slice of bytes, `[]const u8`, assumed (by convention, not enforcement) to hold UTF-8. This means every slice operation, iteration pattern, and API that works on `[]const T` already works on strings — there's no separate string API surface to learn, no implicit encoding conversion, and no hidden allocation from "string operations."

## Bad

```zig
const std = @import("std");

// Inventing a wrapper type for "string" duplicates what []const u8 already
// provides and adds a conversion tax at every boundary with std library code.
const MyString = struct {
    bytes: []const u8,

    fn length(self: MyString) usize {
        return self.bytes.len;
    }
};
```

## Good

```zig
const std = @import("std");

fn greet(name: []const u8) void {
    std.debug.print("Hello, {s}!\n", .{name});
}

fn isEmpty(s: []const u8) bool {
    return s.len == 0;
}

test "strings are ordinary byte slices" {
    try std.testing.expect(!isEmpty("hi"));
    try std.testing.expect(std.mem.eql(u8, "hi", "hi"));
    try std.testing.expect(std.mem.startsWith(u8, "hello world", "hello"));
}
```

## String Literals Are Sentinel-Terminated Arrays

A string literal like `"hello"` has type `*const [5:0]u8` — a pointer to a fixed-size, null-terminated array — which coerces automatically to `[]const u8` or `[:0]const u8` as needed. This is why literals interoperate with both ordinary Zig string functions and C string APIs without extra ceremony.

## See Also

- [slice-sentinel-terminated](slice-sentinel-terminated.md) - the null-terminated variant used at C boundaries
- [slice-concat-alloc](slice-concat-alloc.md) - building new strings with an explicit allocator
- [interop-null-terminated-strings](interop-null-terminated-strings.md) - passing `[]const u8` strings to C functions
