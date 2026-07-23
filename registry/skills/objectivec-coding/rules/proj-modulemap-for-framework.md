# proj-modulemap-for-framework

> Provide a `module.modulemap` for clean Swift/clang-module imports

## Why It Matters

Without an explicit module map, Clang has to infer one from the umbrella header, which is fragile: private headers can leak into the module, non-modular includes (plain C headers without their own module) cause "include of non-modular header" build errors under `-fmodules`, and Swift's `@import` / `import` of the framework can fail or expose more than intended. An explicit `module.modulemap` makes the module boundary a first-class, version-controlled artifact instead of an inferred guess.

## Bad

```
OMWNetworking.framework/
  Headers/
    OMWNetworking.h
    OMWNetworkClient.h
    OMWRequestBuilder.h
  # No module.modulemap -- Xcode infers one from the umbrella header.
  # Any header not #imported by OMWNetworking.h becomes invisible even
  # though it's still on disk in Headers/, causing confusing
  # "no member named ..." errors for consumers, and no control over
  # which sub-headers are `requires objc` vs implicitly exported.
```

## Good

```
// module.modulemap, placed in the framework's Modules/ directory
// (or Sources/OMWNetworking/include/module.modulemap for SwiftPM).
framework module OMWNetworking {
    umbrella header "OMWNetworking.h"

    export *
    module * { export * }

    // Explicitly declare a header that needs Objective-C to build,
    // so non-ObjC clients get a clear diagnostic instead of a mystery.
    explicit module Private {
        header "OMWNetworkClient+Private.h"
        export *
    }
}
```

```swift
// Consumer: works whether the framework is built with SwiftPM,
// CocoaPods (as a static framework with modular headers), or a
// plain Xcode framework target -- the module map is authoritative.
import OMWNetworking

let client = OMWNetworkClient(baseURL: url)
```

## Swift Package Manager Layout

```
// Package.swift target for a mixed ObjC framework consumed from Swift.
.target(
    name: "OMWNetworking",
    path: "Sources/OMWNetworking",
    publicHeadersPath: "include"
)
// SwiftPM synthesizes the module map from Sources/OMWNetworking/include/
// automatically -- everything under `include/` becomes the module's
// public interface, so private headers must live outside that directory.
```

## See Also

- [`proj-umbrella-header`](proj-umbrella-header.md) - Provide one umbrella header for a framework's public API
- [`proj-private-headers-separate`](proj-private-headers-separate.md) - Keep private/internal headers out of the public framework header directory
- [`proj-package-manager-podspec-spm`](proj-package-manager-podspec-spm.md) - Ship a `.podspec` or Swift Package `Package.swift` target for distribution
