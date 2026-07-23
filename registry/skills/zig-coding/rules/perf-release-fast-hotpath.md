# perf-release-fast-hotpath

> Reach for `ReleaseFast` only on profiled, safety-audited hot paths — not as a default build mode

## Why It Matters

`ReleaseFast` disables the runtime safety checks (bounds checks, integer overflow checks, `unreachable` verification) that catch real bugs in `Debug`/`ReleaseSafe`. The speed gain is real, but it's only a good trade once the code has actually been exercised thoroughly under a safety-checked build — reaching for `ReleaseFast` by default, on unproven code, trades a meaningful safety net for a performance gain you haven't yet confirmed you need.

## Bad

```zig
// build.zig — defaulting straight to ReleaseFast for every build, with no
// stage where safety checks actually ran against the full test suite.
const optimize = std.builtin.OptimizeMode.ReleaseFast;
```

## Good

```zig
// build.zig
const optimize = b.standardOptimizeOption(.{}); // caller chooses: defaults to Debug

// CI runs the full test suite under ReleaseSafe (or Debug) first...
const safe_tests = b.addTest(.{
    .root_source_file = b.path("src/root.zig"),
    .optimize = .ReleaseSafe,
});

// ...and only the final shipped artifact, after tests pass, uses ReleaseFast.
const exe = b.addExecutable(.{
    .name = "app",
    .root_source_file = b.path("src/main.zig"),
    .target = b.standardTargetOptions(.{}),
    .optimize = .ReleaseFast,
});
```

## See Also

- [lint-releasesafe-prod](lint-releasesafe-prod.md) - the safer production default for most projects
- [lint-releasefast-hotpath](lint-releasefast-hotpath.md) - the linting-category framing of the same caution
- [perf-benchmark-before](perf-benchmark-before.md) - the profiling step that should precede this decision
