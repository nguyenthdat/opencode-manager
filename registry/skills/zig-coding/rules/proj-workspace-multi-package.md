# proj-workspace-multi-package

> Structure multi-package repos with a shared root `build.zig` coordinating each package's own build logic

## Why It Matters

A repository containing several related packages (a core library, a CLI built on it, a set of plugins) benefits from one coordinating root `build.zig` that wires them together via `b.dependency`/local path dependencies — giving a single `zig build test` that exercises everything, while each package still has its own `build.zig.zon` and can be consumed independently by external projects.

## Bad

```
repo/
  core/
    src/...
  cli/
    src/...
  # No root build.zig — building or testing "the whole project" means
  # manually cd-ing into each package and running commands separately,
  # with no single command that verifies everything together.
```

## Good

```
repo/
  build.zig            # root: coordinates both packages, defines `zig build test` for the whole repo
  build.zig.zon         # root manifest, referencing local packages by path
  core/
    build.zig
    build.zig.zon
    src/root.zig
  cli/
    build.zig
    build.zig.zon
    src/main.zig
```

```zig
// repo/build.zig.zon (excerpt) — local path dependency between packages
.{
    .dependencies = .{
        .core = .{ .path = "core" },
    },
}
```

```zig
// repo/build.zig (excerpt)
const core_dep = b.dependency("core", .{ .target = target, .optimize = optimize });
cli_exe.root_module.addImport("core", core_dep.module("core"));
```

## See Also

- [proj-build-zig-zon-deps](proj-build-zig-zon-deps.md) - the dependency declaration mechanism used for local packages too
- [proj-package-boundaries](proj-package-boundaries.md) - deciding what belongs in each package in the first place
- [proj-build-steps-custom](proj-build-steps-custom.md) - a root-level `test` step that spans every package
