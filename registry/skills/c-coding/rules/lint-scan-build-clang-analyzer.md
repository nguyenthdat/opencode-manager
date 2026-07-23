# lint-scan-build-clang-analyzer

> Run Clang's path-sensitive static analyzer (`scan-build`) periodically to find deep, cross-function bugs that pattern-based linters miss

## Why It Matters

The Clang Static Analyzer performs symbolic execution along many possible code paths, tracking value ranges and null-ness across function boundaries — it can find bugs like "this pointer is `NULL` on one specific path through three nested function calls" that simple pattern-matching linters (which mostly look at one function or one expression at a time) cannot detect. It is slower than clang-tidy/cppcheck, which is why it's typically run periodically (nightly, or on a schedule) rather than on every single commit.

## Bad

```sh
# Only fast, pattern-based linters run in CI; cross-function, path-sensitive
# bugs that require symbolic execution to find go completely unchecked.
```

## Good

```sh
scan-build cc -std=c17 -Iinclude -c src/*.c -o /dev/null
# or, integrated with an existing Makefile/CMake build:
scan-build make
scan-build cmake --build build
```

`scan-build` produces an HTML report per finding, showing the exact path of function calls and conditions that lead to the potential bug.

## Scheduled CI Job (Not Blocking Every PR)

```yaml
# .github/workflows/deep-analysis.yml
on:
  schedule:
    - cron: '0 2 * * *'   # nightly, given the higher runtime cost
jobs:
  scan-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: scan-build --status-bugs cmake --build build
```

## See Also

- [lint-clang-tidy-checks](lint-clang-tidy-checks.md) - The faster, per-commit complement to this deeper analysis
- [lint-static-analysis-in-ci](lint-static-analysis-in-ci.md) - Where this fits into a broader CI analysis strategy
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - A bug class this path-sensitive analyzer is well-suited to find
