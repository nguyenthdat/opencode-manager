# proj-build-zig-zon-deps

> Manage dependencies through `build.zig.zon` with pinned hashes, not vendored or ad hoc fetching

## Why It Matters

`build.zig.zon` is Zig's package manifest: it declares dependencies by URL (or path) plus a content hash that the build system verifies on fetch, giving reproducible builds without a separate lockfile format or manual vendoring. Pinning the hash means a dependency can't silently change out from under a build — any tampering or unexpected update is caught immediately as a hash mismatch.

## Bad

```zig
// build.zig.zon — no hash means no verification of what actually gets
// fetched, and the build tooling will refuse to trust this dependency
// without one anyway.
.{
    .name = "my_project",
    .version = "0.1.0",
    .dependencies = .{
        .some_lib = .{
            .url = "https://github.com/example/some_lib/archive/main.tar.gz",
        },
    },
}
```

## Good

```zig
// build.zig.zon
.{
    .name = "my_project",
    .version = "0.1.0",
    .minimum_zig_version = "0.13.0",
    .dependencies = .{
        .some_lib = .{
            .url = "https://github.com/example/some_lib/archive/refs/tags/v2.3.0.tar.gz",
            .hash = "1220a1b2c3d4e5f6...", // verified by `zig build` on fetch
        },
    },
    .paths = .{""},
}
```

```zig
// build.zig (excerpt) — consuming the declared dependency
const some_lib = b.dependency("some_lib", .{ .target = target, .optimize = optimize });
exe.root_module.addImport("some_lib", some_lib.module("some_lib"));
```

## Getting the Hash

`zig fetch --save <url>` fetches the dependency, computes its hash, and writes both the URL and hash into `build.zig.zon` automatically — avoid hand-typing a hash.

## See Also

- [proj-version-pin](proj-version-pin.md) - the `minimum_zig_version` field shown above
- [proj-vendored-vs-zon](proj-vendored-vs-zon.md) - when vendoring is still preferable to a `build.zig.zon` dependency
- [proj-build-zig-module](proj-build-zig-module.md) - consuming a fetched dependency's module in the build graph
