# lint-releasesafe-prod

> Use `ReleaseSafe` in production when correctness matters more than squeezing out maximum speed

## Why It Matters

`ReleaseSafe` compiles with optimizations enabled *and* keeps the same runtime safety checks as `Debug` (bounds checks, overflow checks, `unreachable` verification) — a crash from a genuine bug becomes a clear panic with a stack trace, instead of `ReleaseFast`'s silent undefined behavior. For most production services, this trade (a real but usually modest speed cost, in exchange for safety checks catching bugs before they become security incidents or data corruption) is the right default.

## Bad

```zig
// build.zig — jumping straight to ReleaseFast for a production service
// without ever weighing whether the speed gain over ReleaseSafe is
// actually needed, or worth losing bounds/overflow checking.
const optimize = std.builtin.OptimizeMode.ReleaseFast;
```

## Good

```zig
// build.zig
const optimize = b.standardOptimizeOption(.{
    .preferred_optimize_mode = .ReleaseSafe, // sensible production default
});
```

```sh
zig build -Doptimize=ReleaseSafe
```

## When `ReleaseFast` Is Actually Justified

Reserve `ReleaseFast` for code that: has been thoroughly exercised under `Debug`/`ReleaseSafe` first (in CI, not just locally), is on a profiled hot path where the safety-check overhead has been measured and matters, and where the cost of undefined behavior on a rare bug is acceptable relative to the speed gained. See `perf-release-fast-hotpath` and `lint-releasefast-hotpath`.

## See Also

- [lint-releasefast-hotpath](lint-releasefast-hotpath.md) - the narrower, evidence-gated case for `ReleaseFast`
- [lint-debug-default](lint-debug-default.md) - the development-time counterpart to this production default
- [slice-bounds-safety](slice-bounds-safety.md) - the specific safety guarantee `ReleaseSafe` preserves over `ReleaseFast`
