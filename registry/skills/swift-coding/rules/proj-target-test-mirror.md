# proj-target-test-mirror

> Mirror test targets 1:1 with library targets

## Why It Matters

A single catch-all `Tests/` target covering every library target makes it impossible to run just the tests for the module you're actively changing, muddies `@testable import` boundaries (tests for `NetworkingKit` end up depending on `PersistenceKit` internals just because they share a test target), and obscures which library targets actually have test coverage at all. One test target per library target lets you run `swift test --filter NetworkingKitTests` in isolation, keeps each test target's dependencies matching exactly the target it tests, and makes an untested library target immediately visible as "no matching test target exists."

## Bad

```swift
// Package.swift — one shared test target for everything
targets: [
    .target(name: "NetworkingKit"),
    .target(name: "PersistenceKit"),
    .target(name: "AnalyticsKit"),
    .testTarget(
        name: "AllTests",
        dependencies: ["NetworkingKit", "PersistenceKit", "AnalyticsKit"]
    )
]
```
```
Tests/AllTests/
  NetworkingTests.swift
  PersistenceTests.swift
  SomeAnalyticsTests.swift   // easy to lose track of what's actually covered
```

## Good

```swift
// Package.swift — one test target per library target
targets: [
    .target(name: "NetworkingKit"),
    .target(name: "PersistenceKit"),
    .target(name: "AnalyticsKit"),

    .testTarget(name: "NetworkingKitTests", dependencies: ["NetworkingKit"]),
    .testTarget(name: "PersistenceKitTests", dependencies: ["PersistenceKit"]),
    .testTarget(name: "AnalyticsKitTests", dependencies: ["AnalyticsKit"])
]
```
```
Tests/
  NetworkingKitTests/
  PersistenceKitTests/
  AnalyticsKitTests/
```

Running `swift test --filter NetworkingKitTests` now runs exactly the networking suite, and a library target with no corresponding `<Name>Tests` target is an obvious, greppable gap.

## Shared Test Utilities Without Breaking the Mirror

Common test helpers (fixture builders, mock factories) go in their own small target that test targets depend on — this keeps the 1:1 mirror intact while still avoiding duplication:

```swift
targets: [
    .target(name: "TestSupport", dependencies: ["NetworkingKit", "PersistenceKit"]),
    .testTarget(name: "NetworkingKitTests", dependencies: ["NetworkingKit", "TestSupport"]),
    .testTarget(name: "PersistenceKitTests", dependencies: ["PersistenceKit", "TestSupport"])
]
```

## See Also

- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - the library target structure this mirrors
- [`test-fixture-setup-teardown`](test-fixture-setup-teardown.md) - fixture lifecycle within each mirrored test target
- [`test-uitest-separate-target`](test-uitest-separate-target.md) - UI tests get their own separate target, outside this mirror
