# interop-error-boundary-c

> Translate Zig error unions into C-friendly return codes at the FFI boundary

## Why It Matters

C has no error-union type — callers there expect an integer status code (0 for success, negative or nonzero for specific failures) or a sentinel return value. An `export fn` cannot return `!T` directly to a C caller in a way C understands; the boundary function must catch the Zig error union and translate it into whatever convention the C side expects, typically a status code plus an out-parameter for the actual value.

## Bad

```zig
const std = @import("std");

// This doesn't compile as an exported C-callable function: C has no
// concept of a Zig error union return type to decode.
export fn parse_value(input: [*:0]const u8) !c_int {
    return std.fmt.parseInt(c_int, std.mem.sliceTo(input, 0), 10);
}
```

## Good

```zig
const std = @import("std");

// 0 = success, negative = specific error code, matching a documented
// C-side contract; the actual value comes back through an out-parameter.
export fn parse_value(input: [*:0]const u8, out: *c_int) c_int {
    const result = std.fmt.parseInt(c_int, std.mem.sliceTo(input, 0), 10) catch |err| {
        return switch (err) {
            error.InvalidCharacter => -1,
            error.Overflow => -2,
        };
    };
    out.* = result;
    return 0;
}

test "error union translated to a C status code" {
    var value: c_int = 0;
    try std.testing.expectEqual(@as(c_int, 0), parse_value("42", &value));
    try std.testing.expectEqual(@as(c_int, 42), value);
    try std.testing.expectEqual(@as(c_int, -1), parse_value("abc", &value));
}
```

## Document the Status Code Contract on the C Side Too

Since the meaning of each code lives only in documentation once it crosses into C, keep a single source of truth (a shared header comment, or a generated header) listing every code and its meaning — this mirrors `doc-error-set-document`, just projected into a form C can consume.

## See Also

- [interop-export-c-calling-convention](interop-export-c-calling-convention.md) - the export mechanism this translation wraps
- [doc-error-set-document](doc-error-set-document.md) - documenting the Zig-side error set being translated
- [err-switch-exhaustive-err](err-switch-exhaustive-err.md) - exhaustively mapping every error to its C status code
