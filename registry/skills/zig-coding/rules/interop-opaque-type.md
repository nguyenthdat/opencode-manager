# interop-opaque-type

> Use `opaque {}` for FFI handles to C types whose internal layout you don't need (or aren't allowed) to know

## Why It Matters

Many C libraries expose a handle type (`sqlite3*`, `FILE*`, a library-internal context struct) whose internals are meant to stay private to the library — you only ever hold a pointer and pass it back into the library's own functions. `opaque {}` models exactly this: a type with unknown size and layout, usable only behind a pointer, that prevents Zig code from accidentally dereferencing or introspecting fields it has no business touching.

## Bad

```zig
const std = @import("std");

// Guessing at (or partially reverse-engineering) a C library's internal
// struct layout, when the library never promised a stable layout at all.
const SqliteHandle = extern struct {
    _opaque_bytes: [128]u8, // fragile: breaks the moment the real struct's size changes
};
```

## Good

```zig
const std = @import("std");

// The real internal layout is irrelevant to Zig code — only a pointer to
// it is ever held, and it's only ever passed back into the C library.
pub const SqliteHandle = opaque {};

extern fn sqlite3_open(filename: [*:0]const u8, db: **SqliteHandle) c_int;
extern fn sqlite3_close(db: *SqliteHandle) c_int;

fn open(path: [:0]const u8) !*SqliteHandle {
    var handle: ?*SqliteHandle = null;
    if (sqlite3_open(path.ptr, &handle) != 0) return error.OpenFailed;
    return handle.?;
}
```

## `@cImport` Often Generates This Automatically

When translate-C encounters a C struct declared but never defined (a common pattern for library-private handles), it produces exactly an `opaque` type — you rarely need to write this by hand for anything already going through `@cImport`.

## See Also

- [interop-cimport-cinclude](interop-cimport-cinclude.md) - the mechanism that often generates opaque types for you
- [api-vtable-dynamic](api-vtable-dynamic.md) - `anyopaque`, the type-erased pointer counterpart used in Zig-native vtables
- [alloc-init-deinit-pair](alloc-init-deinit-pair.md) - wrapping an opaque handle in an idiomatic init/deinit pair
