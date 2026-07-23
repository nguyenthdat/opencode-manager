# lint-warnings-as-errors

> Treat warnings as errors in CI builds

## Why It Matters

A compiler warning that nobody is forced to fix accumulates: deprecated-API warnings, unused-variable warnings, and implicit-conversion warnings pile up until the warnings list is so long that a genuinely new, important warning is invisible in the noise. Treating warnings as errors in CI (while optionally leaving local dev builds warning-only for faster iteration) forces every warning to be addressed or explicitly suppressed at the point it's introduced, keeping the warnings list at zero and making a new warning impossible to miss.

## Bad

```swift
// Package.swift — warnings accumulate silently, nobody notices new ones
.target(
    name: "AppFeature",
    dependencies: ["Networking"]
    // no -warnings-as-errors; CI passes even with 200 warnings
)
```
```
$ swift build
warning: 'foo(bar:)' is deprecated: use 'foo(baz:)' instead
warning: variable 'result' was never used; consider replacing with '_'
warning: initialization of immutable value 'x' was never used
... (197 more, scrolled past every single build)
Build complete!
```

## Good

```swift
// Package.swift
.target(
    name: "AppFeature",
    dependencies: ["Networking"],
    swiftSettings: [
        .unsafeFlags(["-warnings-as-errors"])
    ]
)
```

```yaml
# .github/workflows/ci.yml
name: CI
on: [pull_request]
jobs:
  build:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build (warnings fail the build)
        run: swift build -Xswiftc -warnings-as-errors
      - name: Test
        run: swift test -Xswiftc -warnings-as-errors
```

Now a new deprecated-API usage or unused variable fails the PR check immediately, at the commit that introduced it, instead of blending into an ever-growing warnings list nobody reads.

## Rolling Out on a Warning-Heavy Legacy Target

Turning this on for a target with an existing warning backlog will break the build immediately. Fix the backlog first (often mechanical: `-fix-it` suggestions, deprecated-API replacements), or scope `-warnings-as-errors` to only the newest targets while legacy targets are cleaned up incrementally:

```swift
targets: [
    .target(name: "LegacyCore"),  // no flag yet — backlog being paid down
    .target(
        name: "NewFeature",
        swiftSettings: [.unsafeFlags(["-warnings-as-errors"])]
    )
]
```

## See Also

- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - the style/safety-lint counterpart enforced the same way
- [`lint-analyze-build`](lint-analyze-build.md) - static analyzer passes that pair with a strict warnings gate
- [`lint-strict-concurrency-complete`](lint-strict-concurrency-complete.md) - concurrency diagnostics are often warnings first, before becoming errors under Swift 6 mode
