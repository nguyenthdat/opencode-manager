# lint-releasefast-hotpath

> Reserve `ReleaseFast` for specific, profiled, safety-audited hot paths, not the whole program by default

## Why It Matters

`ReleaseFast` strips runtime safety checks entirely in exchange for maximum speed — appropriate once a code path has been proven correct under `Debug`/`ReleaseSafe` and profiling has shown the safety-check overhead genuinely matters there. Applying it blanket, to an entire program, means every function loses its safety net equally, including the many that were never actually a bottleneck and gain nothing from the trade.

## Bad

```zig
// build.zig — the entire application, including cold startup code,
// configuration parsing, and rarely-called admin endpoints, all lose
// bounds/overflow checking for a speed benefit that was never measured
// or needed outside one specific hot loop.
const optimize = std.builtin.OptimizeMode.ReleaseFast;
```

## Good

```zig
// build.zig (excerpt) — ship the whole program under ReleaseSafe, but
// isolate a proven hot path into its own compilation unit built with
// ReleaseFast specifically, after profiling justified it.
const app_exe = b.addExecutable(.{
    .name = "app",
    .root_source_file = b.path("src/main.zig"),
    .target = target,
    .optimize = .ReleaseSafe,
});

// A separately built, narrowly-scoped hot-path module, compiled ReleaseFast
// only after a profiler identified it as the bottleneck.
const hot_path_mod = b.createModule(.{
    .root_source_file = b.path("src/hot_path.zig"),
    .target = target,
    .optimize = .ReleaseFast,
});
app_exe.root_module.addImport("hot_path", hot_path_mod);
```

## The Checklist Before Reaching for `ReleaseFast`

1. Profiled evidence this specific code is a bottleneck.
2. Thorough test coverage exercised under `Debug`/`ReleaseSafe` first.
3. A documented reason (in a comment or ADR) for why the risk is acceptable here specifically.

## See Also

- [lint-releasesafe-prod](lint-releasesafe-prod.md) - the safer default this rule narrows away from
- [perf-release-fast-hotpath](perf-release-fast-hotpath.md) - the performance-category framing of the same caution
- [perf-benchmark-before](perf-benchmark-before.md) - the profiling step that must precede this decision
