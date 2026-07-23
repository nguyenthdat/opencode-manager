# interop-c-abi-types

> Translate C ABI types correctly using `c_int`, `c_long`, and friends — don't assume a fixed-width Zig type matches

## Why It Matters

C's `int`, `long`, and similar types have platform- and compiler-dependent widths — `c_int` is not guaranteed to be the same as `i32` on every target, even though it usually is on common ones. Zig's `std.c` (or the `c_int`/`c_long`/`c_longlong` builtins available at the language level) encode the actual ABI-correct width for the target being compiled for, which a hardcoded `i32`/`i64` does not.

## Bad

```zig
const std = @import("std");

// Assumes C's `int` is exactly 32 bits on every target Zig might compile
// for — usually true, but not something to hardcode when a correct,
// target-aware type already exists.
extern fn c_compute(value: i32) i32;
```

## Good

```zig
const std = @import("std");

extern fn c_compute(value: c_int) c_int;

test "c_int matches the target's actual C int width" {
    try std.testing.expect(@sizeOf(c_int) >= 2); // C guarantees at least 16 bits
}
```

## Common C-to-Zig Type Mappings

| C type | Zig type |
|--------|----------|
| `int` | `c_int` |
| `unsigned int` | `c_uint` |
| `long` | `c_long` |
| `size_t` | `usize` |
| `char*` (string) | `[*:0]const u8` / `[*:0]u8` |
| `void*` | `*anyopaque` |
| `struct Foo*` (opaque) | `*c.Foo` (via `@cImport`) or `*opaque {}` |

## See Also

- [interop-cimport-cinclude](interop-cimport-cinclude.md) - importing headers so these mappings are generated automatically
- [interop-null-terminated-strings](interop-null-terminated-strings.md) - the string half of this type-mapping concern
- [interop-opaque-type](interop-opaque-type.md) - handling `void*`-style opaque handles specifically
