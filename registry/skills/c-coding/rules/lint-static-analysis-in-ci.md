# lint-static-analysis-in-ci

> Run static analysis (clang-tidy, cppcheck, scan-build) as a required, blocking CI job, not as an optional local-only tool

## Why It Matters

Static analysis findings that only run when a developer happens to invoke them locally get skipped under deadline pressure, and drift out of date as the codebase grows. Making analysis a required CI check ensures every change is actually analyzed before merge, and that new findings are caught at the moment they're introduced rather than discovered much later during an occasional audit.

## Bad

```
(clang-tidy/cppcheck exist in the repo's tooling docs, but nothing in CI
actually runs them; they're invoked manually, rarely, if ever)
```

## Good

```yaml
# .github/workflows/static-analysis.yml
name: Static Analysis
on: [pull_request]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Install tools
        run: sudo apt-get install -y clang-tidy cppcheck
      - name: Run clang-tidy
        run: clang-tidy $(find src -name '*.c') -- -std=c17 -Iinclude
      - name: Run cppcheck
        run: cppcheck --enable=warning,style,performance --error-exitcode=1 -Iinclude src/
```

## Baseline First, Then Ratchet Up Strictness

For an existing codebase with an established backlog of findings, generate a baseline suppression file first (most tools support this), require no *new* findings beyond the baseline, and incrementally shrink the baseline over time — rather than blocking on fixing everything at once, which usually stalls the whole effort.

## Treat Analysis Failures Like Test Failures

A blocked merge from a static-analysis finding should be exactly as actionable and taken exactly as seriously as a failing unit test — that requires keeping the false-positive rate low (tune check sets, use documented suppressions sparingly) so the signal stays trusted.

## See Also

- [lint-clang-tidy-checks](lint-clang-tidy-checks.md) - Configuring the specific checks run here
- [lint-cppcheck-static-analysis](lint-cppcheck-static-analysis.md) - The complementary analyzer run here
- [lint-werror-in-ci](lint-werror-in-ci.md) - The equivalent enforcement principle for compiler warnings
