# proj-package-swift-tools-version

> Declare accurate `swift-tools-version` and platforms

## Why It Matters

`swift-tools-version` at the top of `Package.swift` determines which `PackageDescription` API is available and which language-mode defaults apply — declaring a version higher than what the manifest actually needs pointlessly narrows the set of toolchains that can consume the package, while declaring one lower than what's used causes confusing "not available" errors on manifest APIs. Under-declaring or omitting `platforms` is worse: SPM will let the package build against a deployment target the code doesn't actually support, and the failure only surfaces at link time or runtime on an older OS instead of at the point the package is added as a dependency.

## Bad

```swift
// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "AnalyticsKit",
    // no platforms declared — SPM assumes the oldest OSes it still supports
    targets: [
        .target(
            name: "AnalyticsKit",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency")  // requires tools-version 5.8+
            ]
        )
    ]
)
```
This manifest silently fails to resolve on toolchains that predate the feature flag it uses, with an error that doesn't point at the real cause (the too-low tools version).

## Good

```swift
// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "AnalyticsKit",
    platforms: [.iOS(.v16), .macOS(.v13), .watchOS(.v9)],
    products: [.library(name: "AnalyticsKit", targets: ["AnalyticsKit"])],
    targets: [
        .target(
            name: "AnalyticsKit",
            swiftSettings: [.enableUpcomingFeature("StrictConcurrency")]
        ),
        .testTarget(name: "AnalyticsKitTests", dependencies: ["AnalyticsKit"])
    ]
)
```

## Bumping Tools Version Deliberately

Treat a `swift-tools-version` bump like a semver-relevant change: it can break consumers pinned to an older toolchain. Bump only when you need a manifest API or language feature the new version unlocks, and note the reason in the same commit:

```swift
// swift-tools-version: 6.0
// Bumped from 5.9 to adopt `.swiftLanguageMode(.v6)` for strict concurrency by default.
import PackageDescription

let package = Package(
    name: "AnalyticsKit",
    platforms: [.iOS(.v17), .macOS(.v14)],
    targets: [
        .target(
            name: "AnalyticsKit",
            swiftSettings: [.swiftLanguageMode(.v6)]
        )
    ]
)
```

Keep `platforms` in lockstep with the minimum OS APIs actually referenced in source — raising a platform minimum to use one new API is a deliberate, visible decision, not an accident of copy-pasting a template manifest.

## See Also

- [`proj-internal-by-default`](proj-internal-by-default.md) - access-control decisions made once tools-version/platforms are set
- [`proj-target-test-mirror`](proj-target-test-mirror.md) - test targets declared in the same manifest
- [`lint-strict-concurrency-complete`](lint-strict-concurrency-complete.md) - a common reason to bump tools-version
- [`proj-conditional-compilation-platform`](proj-conditional-compilation-platform.md) - handling code that must run below the declared platform minimum
