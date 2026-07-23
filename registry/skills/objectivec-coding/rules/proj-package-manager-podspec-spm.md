# proj-package-manager-podspec-spm

> Ship a `.podspec` or Swift Package `Package.swift` target for distribution

## Why It Matters

Without a package manifest, consumers must vendor your source directly (copy files into their project, manually track updates, manually resolve transitive dependencies), which loses version pinning, reproducible builds, and any automated dependency-graph resolution. A `.podspec` or `Package.swift` turns your library into a first-class dependency that downstream projects can pin, upgrade, and audit like any other.

## Bad

```
OMWNetworking/
  OMWNetworkClient.h
  OMWNetworkClient.m
  OMWRequestBuilder.h
  OMWRequestBuilder.m
  README.md
// No podspec, no Package.swift. Consumers are told in the README to
// "drag these files into your project" -- no version pinning, no way
// to detect that a consumer is three major versions behind, and any
// transitive dependency (e.g. on a JSON library) must be manually
// vendored too.
```

## Good

```ruby
# OMWNetworking.podspec
Pod::Spec.new do |s|
  s.name             = "OMWNetworking"
  s.version          = "2.4.0"
  s.summary          = "Lightweight networking layer for OMW apps."
  s.homepage         = "https://github.com/openswat/omw-networking"
  s.license          = { :type => "MIT", :file => "LICENSE" }
  s.author           = { "OMW Platform Team" => "platform@example.com" }
  s.source           = { :git => "https://github.com/openswat/omw-networking.git",
                          :tag => s.version.to_s }
  s.ios.deployment_target = "13.0"
  s.source_files     = "Sources/OMWNetworking/**/*.{h,m}"
  s.public_header_files = "Sources/OMWNetworking/include/**/*.h"
  s.requires_arc     = true
  s.frameworks       = "Foundation"
end
```

```swift
// Package.swift -- Swift Package Manager manifest for the same library.
// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "OMWNetworking",
    platforms: [.iOS(.v13), .macOS(.v11)],
    products: [
        .library(name: "OMWNetworking", targets: ["OMWNetworking"])
    ],
    targets: [
        .target(
            name: "OMWNetworking",
            path: "Sources/OMWNetworking",
            publicHeadersPath: "include"
        ),
        .testTarget(
            name: "OMWNetworkingTests",
            dependencies: ["OMWNetworking"],
            path: "Tests/OMWNetworkingTests"
        )
    ]
)
```

## Semantic Versioning Discipline

```ruby
# Bump s.version according to semver when the public API changes:
# - PATCH (2.4.1): bug fix, no API change
# - MINOR (2.5.0): new public API, backward compatible
# - MAJOR (3.0.0): breaking change to a public header
s.version = "2.4.0"
```

## See Also

- [`proj-modulemap-for-framework`](proj-modulemap-for-framework.md) - Provide a `module.modulemap` for clean Swift/clang-module imports
- [`proj-umbrella-header`](proj-umbrella-header.md) - Provide one umbrella header for a framework's public API
- [`proj-private-headers-separate`](proj-private-headers-separate.md) - Keep private/internal headers out of the public framework header directory
