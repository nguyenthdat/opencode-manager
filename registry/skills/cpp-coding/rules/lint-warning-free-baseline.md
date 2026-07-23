# lint-warning-free-baseline

> Treat new warnings as build failures

## Why It Matters

A codebase that tolerates warnings ("we'll clean those up eventually") accumulates them until the count is so large that genuinely new, important warnings are invisible in the noise — nobody reads a build log with 3,000 existing warnings closely enough to notice the 3,001st. Enforcing a zero-warning baseline (via `-Werror` and equivalent CI gates) means every new warning is visible and must be addressed immediately, before it joins an ignorable pile.

## Bad

```
Build succeeded with 2,847 warnings.
```
```cmake
# Warnings are enabled (-Wall -Wextra) but not treated as errors — they
# accumulate indefinitely and are effectively invisible in review.
target_compile_options(myapp PRIVATE -Wall -Wextra)
```

## Good

```cmake
target_compile_options(myapp PRIVATE -Wall -Wextra -Wpedantic -Werror)
# Build FAILS the moment a new warning is introduced — it must be fixed
# (or explicitly, narrowly suppressed with justification) before merging.
```

## Migrating an Existing, Warning-Heavy Codebase

```cmake
# Step 1: Enable warnings without -Werror; generate a report of current warnings.
# Step 2: File and fix the backlog (or suppress with justification per-file).
# Step 3: Flip on -Werror once clean, and keep it on permanently:
target_compile_options(myapp PRIVATE -Wall -Wextra -Wpedantic -Werror)
```

## CI Gate

```yaml
build:
  script:
    - cmake -B build -DCMAKE_CXX_FLAGS="-Wall -Wextra -Wpedantic -Werror"
    - cmake --build build   # Fails the pipeline on any new warning
```

## See Also

- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - The specific flags that establish this baseline
- [lint-clang-tidy-baseline](lint-clang-tidy-baseline.md) - Applying the same zero-tolerance approach to static analysis
- [lint-clang-format-consistent](lint-clang-format-consistent.md) - The equivalent enforcement approach for formatting
