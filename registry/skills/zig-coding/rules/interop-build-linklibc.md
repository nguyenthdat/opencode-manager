# interop-build-linklibc

> Link libc explicitly (`linkLibC`) whenever calling into C-dependent APIs or libraries

## Why It Matters

Zig programs don't link libc by default — many `std` functions work entirely without it, using Zig's own implementations. The moment code calls into `@cImport`ed C functions, links a system library that itself depends on libc, or uses certain OS-level APIs, `build.zig` must explicitly request libc linkage, or the build fails (or worse, silently misbehaves on some platforms) with missing symbols.

## Bad

```zig
// build.zig (excerpt) — links a system library that depends on libc,
// without ever telling the build to link libc itself.
const exe = b.addExecutable(.{
    .name = "app",
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = optimize,
});
exe.linkSystemLibrary("sqlite3"); // implicitly needs libc; not yet linked
```

## Good

```zig
// build.zig (excerpt)
const exe = b.addExecutable(.{
    .name = "app",
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = optimize,
});
exe.linkLibC();
exe.linkSystemLibrary("sqlite3");
```

## Also Needed for `@cImport` Itself

Any use of `@cImport` combined with the C standard library headers (`<stdio.h>`, `<stdlib.h>`, etc.) requires `linkLibC()` for the resulting symbols to actually resolve at link time — this is easy to forget since `@cImport` itself compiles cleanly without it, and only linking fails.

## See Also

- [interop-cimport-cinclude](interop-cimport-cinclude.md) - the header-import step this linkage supports
- [interop-zig-as-c-compiler](interop-zig-as-c-compiler.md) - building C sources that also need libc linked
- [proj-build-zig-module](proj-build-zig-module.md) - the broader build.zig structure this linkage step lives in
