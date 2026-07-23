# lint-build-mode-per-target

> Set distinct optimize modes per build target (executable vs. tests vs. library) rather than one blanket setting

## Why It Matters

A project's executable, its test suite, and any library artifacts it produces don't necessarily need the same optimize mode — tests benefit from `Debug`'s fast compilation and full safety checks regardless of what the shipped executable uses, and a library consumed by multiple downstream projects may want to let the *consumer* choose rather than baking in one mode.

## Bad

```zig
// build.zig — a single hardcoded optimize mode applied uniformly to the
// executable, the test suite, and any library artifact, regardless of
// how each is actually used.
const optimize = std.builtin.OptimizeMode.ReleaseFast;

const exe = b.addExecutable(.{ .name = "app", .root_source_file = b.path("src/main.zig"), .target = target, .optimize = optimize });
const tests = b.addTest(.{ .root_source_file = b.path("src/root.zig"), .target = target, .optimize = optimize });
```

## Good

```zig
// build.zig
const target = b.standardTargetOptions(.{});
const optimize = b.standardOptimizeOption(.{}); // the shipped exe: caller's choice, defaults to Debug

const exe = b.addExecutable(.{ .name = "app", .root_source_file = b.path("src/main.zig"), .target = target, .optimize = optimize });

// Tests always run under a safety-checked mode, regardless of what -Doptimize
// was passed for the executable — catching bugs matters more here than speed.
const tests = b.addTest(.{
    .root_source_file = b.path("src/root.zig"),
    .target = target,
    .optimize = .Debug,
});
```

## See Also

- [lint-debug-default](lint-debug-default.md) - the mode tests should typically use regardless of the exe's own setting
- [lint-releasesafe-prod](lint-releasesafe-prod.md) - a common choice for the shipped executable specifically
- [proj-build-zig-module](proj-build-zig-module.md) - the broader build graph where these distinct settings live
