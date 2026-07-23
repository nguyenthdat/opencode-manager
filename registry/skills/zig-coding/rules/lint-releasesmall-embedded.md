# lint-releasesmall-embedded

> Use `ReleaseSmall` for size-constrained targets (embedded, WASM) where binary size outweighs raw speed

## Why It Matters

`ReleaseSmall` optimizes for binary size, sometimes at the cost of speed compared to `ReleaseFast` — the right trade-off for firmware with kilobytes of flash, a WASM bundle downloaded over the network, or any target where every extra kilobyte has a real, direct cost that outweighs a modest runtime speed difference.

## Bad

```zig
// build.zig — targeting a microcontroller with 64KB of flash while using
// ReleaseFast, which optimizes for speed and can produce a meaningfully
// larger binary than the flash budget allows.
const optimize = std.builtin.OptimizeMode.ReleaseFast;
const target = b.resolveTargetQuery(.{ .cpu_arch = .thumb, .os_tag = .freestanding });
```

## Good

```zig
// build.zig
const optimize = b.standardOptimizeOption(.{
    .preferred_optimize_mode = .ReleaseSmall,
});
const target = b.resolveTargetQuery(.{ .cpu_arch = .thumb, .os_tag = .freestanding });
```

```sh
zig build -Doptimize=ReleaseSmall
```

## Verify the Actual Size Impact

Compare `ReleaseSmall` against `ReleaseFast`/`ReleaseSafe` for your actual binary before committing to it project-wide — the size/speed trade-off varies by codebase, and for some workloads the difference is negligible while `ReleaseSafe`'s extra checks remain valuable.

## See Also

- [lint-releasesafe-prod](lint-releasesafe-prod.md) - the safety-preserving alternative when size isn't the binding constraint
- [lint-build-mode-per-target](lint-build-mode-per-target.md) - selecting distinct optimize modes per build target
- [proj-cross-compile-targets](proj-cross-compile-targets.md) - the embedded/freestanding targets this mode typically serves
