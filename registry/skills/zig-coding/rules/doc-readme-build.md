# doc-readme-build

> Maintain a README documenting how to build, test, and depend on the project

## Why It Matters

`build.zig` can express arbitrarily complex build graphs, but a new contributor (or your future self after months away) shouldn't have to read the whole file to learn the three or four commands they actually need day to day. A README with the essential commands, the supported Zig version, and how to add this project as a dependency turns "read build.zig" into "read three lines."

## Bad

```markdown
<!-- README.md -->
# my-project

A project.
```

## Good

```markdown
<!-- README.md -->
# my-project

A small HTTP routing library.

## Requirements

- Zig 0.13.0 (see `build.zig.zon` for the exact pinned version)

## Build & Test

    zig build           # build the library and example binary
    zig build test      # run the unit test suite
    zig build run        # run the example server on :8080

## Using as a Dependency

Add to `build.zig.zon`:

    .my_project = .{
        .url = "https://github.com/example/my-project/archive/<commit>.tar.gz",
        .hash = "...",
    },

Then in `build.zig`:

    const my_project = b.dependency("my_project", .{});
    exe.root_module.addImport("my_project", my_project.module("my_project"));
```

## See Also

- [proj-version-pin](proj-version-pin.md) - the version information a README should surface
- [proj-build-steps-custom](proj-build-steps-custom.md) - the build steps a README should list
- [proj-build-zig-zon-deps](proj-build-zig-zon-deps.md) - the dependency mechanism a README should demonstrate
