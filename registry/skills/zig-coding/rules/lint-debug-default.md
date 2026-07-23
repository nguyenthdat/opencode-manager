# lint-debug-default

> Default to `Debug` mode during development for full safety checks and fast compile times

## Why It Matters

`Debug` is the default `zig build` optimize mode for a reason: it keeps bounds checks, overflow checks, and `unreachable` verification active, and prioritizes fast compilation over runtime speed — exactly the trade-off you want while actively writing and iterating on code, where catching a bug immediately is worth far more than a faster binary.

## Bad

```zig
// build.zig — hardcoding ReleaseFast as the only option removes the
// safety net during everyday development, and slows down the
// edit-compile-test loop with unnecessary optimization work.
const optimize = std.builtin.OptimizeMode.ReleaseFast;
```

## Good

```zig
// build.zig
const optimize = b.standardOptimizeOption(.{}); // defaults to Debug unless -Doptimize= is passed
```

```sh
zig build            # Debug by default: full safety checks, fast compile
zig build test       # tests also run under Debug by default
zig build -Doptimize=ReleaseSafe   # explicit opt-in when needed
```

## Debug Is Also the Right Default for `zig build test`

Running the test suite under `Debug` (or `ReleaseSafe`, see `lint-releasesafe-prod`) maximizes the chance that bounds/overflow/`unreachable` violations are caught by CI before they ever reach a faster, less-checked build.

## See Also

- [lint-releasesafe-prod](lint-releasesafe-prod.md) - the safety-preserving mode for production, once Debug isn't fast enough
- [lint-build-mode-per-target](lint-build-mode-per-target.md) - choosing distinct modes for different build targets
- [slice-bounds-safety](slice-bounds-safety.md) - one of the specific safety checks Debug mode keeps active
