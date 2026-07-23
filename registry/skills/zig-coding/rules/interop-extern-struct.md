# interop-extern-struct

> Use `extern struct` for structs that must match C's memory layout exactly

## Why It Matters

An ordinary Zig struct's field layout is unspecified — the compiler may reorder fields for optimal alignment. `extern struct` guarantees C-compatible layout: fields in declaration order, with C's alignment and padding rules, so a struct shared across the FFI boundary is interpreted identically by both languages.

## Bad

```zig
const std = @import("std");

// An ordinary struct passed across an FFI boundary has no guarantee that
// its field order and padding match what the C side expects.
const Point = struct {
    x: f64,
    y: f64,
};

extern fn c_process_point(p: Point) void; // layout mismatch risk
```

## Good

```zig
const std = @import("std");

const Point = extern struct {
    x: f64,
    y: f64,
};

extern fn c_process_point(p: Point) void;

test "extern struct matches C layout expectations" {
    const p = Point{ .x = 1.0, .y = 2.0 };
    try std.testing.expectEqual(@as(usize, 16), @sizeOf(Point)); // no hidden padding surprises
    _ = p;
}
```

## `extern struct` vs. `packed struct`

`extern struct` follows the *C compiler's* layout rules for the target (including its padding/alignment conventions) — use it when matching a C struct. `packed struct` follows an explicit bit-level layout with no padding at all — use it for wire formats or bit-level hardware register descriptions where even C-style padding is unwanted. See `perf-packed-struct`.

## See Also

- [interop-c-abi-types](interop-c-abi-types.md) - matching individual field types to their C counterparts
- [perf-packed-struct](perf-packed-struct.md) - the bit-packed alternative for non-C-interop use cases
- [interop-export-c-calling-convention](interop-export-c-calling-convention.md) - passing these structs across a C-callable function boundary
