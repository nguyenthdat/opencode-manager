# proj-build-zig-module

> Organize `build.zig` around explicit modules with a clear dependency graph

## Why It Matters

`build.zig` is itself a Zig program that describes the build graph — modules, executables, tests, and their dependencies are all explicit values you construct and wire together. Treating this as real architecture (naming modules clearly, keeping their dependency edges intentional) rather than a pile of copy-pasted `addExecutable` calls keeps a growing project's build comprehensible as it adds pieces.

## Bad

```zig
// build.zig — the same root_source_file is duplicated across every
// executable/test with no shared module in between; adding a new
// dependency means updating every duplicated addImport call.
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    const exe = b.addExecutable(.{
        .name = "app",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    b.installArtifact(exe);
}
```

## Good

```zig
// build.zig
const std = @import("std");

pub fn build(b: *std.Build) void {
    const target = b.standardTargetOptions(.{});
    const optimize = b.standardOptimizeOption(.{});

    // A single shared module other targets depend on explicitly.
    const lib_mod = b.addModule("app_lib", .{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });

    const exe = b.addExecutable(.{
        .name = "app",
        .root_source_file = b.path("src/main.zig"),
        .target = target,
        .optimize = optimize,
    });
    exe.root_module.addImport("app_lib", lib_mod);
    b.installArtifact(exe);

    const tests = b.addTest(.{
        .root_source_file = b.path("src/root.zig"),
        .target = target,
        .optimize = optimize,
    });
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&b.addRunArtifact(tests).step);
}
```

## See Also

- [proj-src-root-module](proj-src-root-module.md) - the root module this graph typically centers on
- [proj-build-steps-custom](proj-build-steps-custom.md) - defining custom steps within this same graph
- [proj-build-zig-zon-deps](proj-build-zig-zon-deps.md) - adding external dependencies into this module graph
