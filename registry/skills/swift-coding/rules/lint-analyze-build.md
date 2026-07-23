# lint-analyze-build

> Run static analyzer/sanitizer passes in CI

## Why It Matters

Standard `swift build`/`swift test` catches type errors and test failures, but a whole class of bugs — data races, memory-safety violations in `unsafe` pointer code, undefined behavior in bridged Objective-C/C code — only surfaces under a sanitizer or the Clang static analyzer, and only when it actually runs, not just when it's available as an option. Skipping these passes in CI means the first time a data race or memory-safety bug surfaces is in a flaky test failure or a field crash report, long after the change that introduced it has been forgotten.

## Bad

```yaml
# .github/workflows/ci.yml — build and test only, no analyzer/sanitizer pass
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: swift build
      - run: swift test
      # No -sanitize=thread, no static analyzer — races and unsafe-memory
      # bugs pass CI silently and surface later as flaky crashes.
```

## Good

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: swift build && swift test

  thread-sanitizer:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Test under Thread Sanitizer
        run: swift test --sanitize=thread

  swiftlint-analyze:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - run: swift build 2>&1 | tee build.log
      - run: swiftlint analyze --compiler-log-path build.log --strict
```

Thread Sanitizer (`--sanitize=thread`) instruments actual concurrent execution and catches data races that strict-concurrency compile-time checking can miss around `@unchecked Sendable` boundaries or Objective-C interop; it's a runtime complement to compile-time checking, not a replacement.

## Address Sanitizer for Unsafe-Pointer/Interop Code

Targets that touch `Unsafe(Mutable)Pointer`, C interop, or bridging headers benefit from Address Sanitizer as well, since those are exactly the places where Swift's normal memory safety guarantees don't apply:

```bash
swift test --sanitize=address
```

Run sanitizer jobs as a separate, possibly nightly/scheduled CI workflow rather than blocking every PR — they're significantly slower than a normal test run, and a good compromise is to run them on `main` after merge plus on a schedule, escalating any failure immediately.

## See Also

- [`lint-strict-concurrency-complete`](lint-strict-concurrency-complete.md) - the compile-time complement to Thread Sanitizer's runtime checks
- [`anti-data-race-unchecked`](anti-data-race-unchecked.md) - the specific anti-pattern sanitizers are meant to catch
- [`lint-unused-import`](lint-unused-import.md) - another analyzer-driven CI pass that shares the compiler-log workflow
