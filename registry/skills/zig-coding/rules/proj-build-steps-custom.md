# proj-build-steps-custom

> Define custom `b.step` targets for common project tasks (test, docs, format-check, lint)

## Why It Matters

`build.zig` can define named steps beyond the default `install`/`run` — `b.step("fmt-check", "...")`, `b.step("docs", "...")` — giving contributors and CI a small, memorable, project-specific command vocabulary (`zig build test`, `zig build fmt-check`) instead of needing to remember raw `zig fmt`/`zig test` invocations and their exact flags.

## Bad

```zig
// build.zig — only the default install/run steps exist; every other task
// (formatting check, docs generation) requires contributors to know and
// type the correct raw command by hand, with no discoverable "zig build --help" entry.
const std = @import("std");

pub fn build(b: *std.Build) void {
    const exe = b.addExecutable(.{ .name = "app", .root_source_file = b.path("src/main.zig"), .target = b.standardTargetOptions(.{}), .optimize = b.standardOptimizeOption(.{}) });
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

    const exe = b.addExecutable(.{ .name = "app", .root_source_file = b.path("src/main.zig"), .target = target, .optimize = optimize });
    b.installArtifact(exe);

    const tests = b.addTest(.{ .root_source_file = b.path("src/root.zig"), .target = target, .optimize = optimize });
    const test_step = b.step("test", "Run unit tests");
    test_step.dependOn(&b.addRunArtifact(tests).step);

    const fmt_check = b.addFmt(.{ .paths = &.{ "src", "build.zig" }, .check = true });
    const fmt_step = b.step("fmt-check", "Check formatting without modifying files");
    fmt_step.dependOn(&fmt_check.step);
}
```

```sh
zig build --help    # lists every custom step, including the ones defined above
zig build test
zig build fmt-check
```

## See Also

- [test-zig-test-command](test-zig-test-command.md) - wiring the `test` step into CI
- [lint-zig-fmt-ci](lint-zig-fmt-ci.md) - wiring the `fmt-check` step into CI
- [proj-build-zig-module](proj-build-zig-module.md) - the broader build graph these steps attach to
