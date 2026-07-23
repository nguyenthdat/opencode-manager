# proj-precompiled-headers-large-builds

> Use PCH/unity builds only after profiling build times

## Why It Matters

Precompiled headers (PCH) and unity builds (concatenating multiple `.cpp` files into one translation unit) can meaningfully reduce large-project build times by avoiding repeated parsing of heavy, stable headers — but they add build-system complexity, can hide missing includes (a file that "works" only because unity-build order happens to include what it needs), and aren't worth the complexity unless build time is a proven, measured problem.

## Bad — Adopted Speculatively, No Measurement

```cmake
# Enabled "because big projects use this," without ever measuring whether
# this specific project's build time actually benefits, and now maintained
# indefinitely as an added source of build-configuration complexity.
target_precompile_headers(everything PRIVATE <a giant list of every header>)
```

## Good — Measure First, Then Apply Deliberately

```bash
# Measure current build time as a baseline
time cmake --build build --target myapp

# Identify the heaviest, most stable, most-included headers as PCH candidates
# (e.g. via -ftime-trace with Clang, or a build-time profiling tool)
```

```cmake
# Apply PCH only to genuinely heavy, stable, widely-included headers
target_precompile_headers(mylib PRIVATE
    <vector>
    <string>
    <memory>
    "third_party/heavy_header.hpp"
)
```

## Unity Builds: Enable Per-Target, Verify Correctness

```cmake
set_target_properties(mylib PROPERTIES UNITY_BUILD ON)
# After enabling, re-run the full test suite: unity builds can surface
# previously-hidden issues (missing #includes relying on inclusion order,
# static/anonymous-namespace symbol collisions across merged files).
```

## Re-Measure After Applying

```bash
time cmake --build build --target myapp   # Confirm the change actually helped,
                                             # and by how much, before keeping it
```

## See Also

- [proj-modules-adoption](proj-modules-adoption.md) - An alternative, more structural build-time improvement
- [proj-minimal-includes](proj-minimal-includes.md) - Reducing include cost without added build-system complexity
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - The same measure-first discipline applied to build time
