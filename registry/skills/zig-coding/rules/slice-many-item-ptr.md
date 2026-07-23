# slice-many-item-ptr

> Understand `[*]T` (many-item pointer) vs `[]T` (slice) vs `*T` (single-item pointer) and use each where it belongs

## Why It Matters

Zig has three distinct pointer flavors and conflating them causes both compile errors and, worse, latent bugs if you reach for `@ptrCast` to force one into another. `*T` points at exactly one `T`. `[]T` is a fat pointer (address + length) into a run of `T`s, with bounds checking. `[*]T` is a raw pointer into an unknown-length run of `T`s — no length, no bounds checking — reserved for C interop and other cases where length truly isn't tracked.

## Bad

```zig
const std = @import("std");

// Accepting a many-item pointer for ordinary application code throws away
// the length information the caller already had, and disables bounds checks.
fn sum(values: [*]const i32, len: usize) i32 {
    var total: i32 = 0;
    var i: usize = 0;
    while (i < len) : (i += 1) total += values[i]; // no bounds checking possible
    return total;
}
```

## Good

```zig
const std = @import("std");

// The slice form carries its own length and gets bounds-checked indexing
// in Debug/ReleaseSafe builds automatically.
fn sum(values: []const i32) i32 {
    var total: i32 = 0;
    for (values) |v| total += v;
    return total;
}

// [*]T earns its place specifically at a raw C FFI boundary, where the
// foreign function's own contract (not Zig's type system) defines the length.
const c = @cImport(@cInclude("some_c_lib.h"));
fn sumFromC(ptr: [*]const i32, len: usize) i32 {
    return sum(ptr[0..len]); // convert to a slice immediately at the boundary
}
```

## Quick Reference

| Type | Points to | Length known? | Typical use |
|------|-----------|----------------|-------------|
| `*T` | exactly one `T` | n/a | a single value, always valid |
| `[]T` | a run of `T` | yes, tracked | ordinary Zig APIs |
| `[*]T` | a run of `T` | no | raw C interop only |
| `[*:0]T` | a run of `T` | via sentinel | C strings |

## See Also

- [slice-prefer-over-array-ptr](slice-prefer-over-array-ptr.md) - preferring `[]T` in ordinary application APIs
- [slice-sentinel-terminated](slice-sentinel-terminated.md) - the sentinel-terminated variant used for C strings
- [interop-c-abi-types](interop-c-abi-types.md) - mapping these pointer flavors onto C's own pointer types
