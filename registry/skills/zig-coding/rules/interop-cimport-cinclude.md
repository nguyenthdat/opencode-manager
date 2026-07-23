# interop-cimport-cinclude

> Use `@cImport`/`@cInclude` to bring in C headers directly, without hand-translating declarations

## Why It Matters

`@cImport(@cInclude("header.h"))` runs Zig's built-in translate-C on the given header at compile time, producing a namespace of Zig declarations matching the C API — function signatures, structs, macros-turned-constants — without you hand-transcribing (and risking transcription errors in) every declaration you need.

## Bad

```zig
// Hand-declaring an `extern` binding for a C function invites transcription
// errors (wrong parameter types, wrong calling convention) that @cImport
// avoids by parsing the real header directly.
const std = @import("std");
extern fn sqlite3_open(filename: [*:0]const u8, db: **anyopaque) c_int;
```

## Good

```zig
const std = @import("std");
const c = @cImport({
    @cInclude("sqlite3.h");
});

fn openDatabase(path: [:0]const u8) !*c.sqlite3 {
    var db: ?*c.sqlite3 = null;
    const rc = c.sqlite3_open(path.ptr, &db);
    if (rc != c.SQLITE_OK) return error.OpenFailed;
    return db.?;
}
```

## Linking the Underlying C Library

`@cImport` only handles the header declarations — the actual library still needs to be linked in `build.zig`:

```zig
// build.zig (excerpt)
exe.linkSystemLibrary("sqlite3");
exe.linkLibC();
```

## See Also

- [interop-build-linklibc](interop-build-linklibc.md) - linking the C runtime and libraries `@cImport`ed headers need
- [interop-c-abi-types](interop-c-abi-types.md) - the C type mappings `@cImport` produces
- [interop-zig-as-c-compiler](interop-zig-as-c-compiler.md) - using Zig's toolchain to build the C side too
