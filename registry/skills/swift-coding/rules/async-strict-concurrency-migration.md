# async-strict-concurrency-migration

> Migrate incrementally under strict concurrency checking

## Why It Matters

Swift 6's strict concurrency checking turns every data-race risk (missing `Sendable` conformance, unchecked actor crossings, unsafe global mutable state) into a compile error instead of a runtime crash — but flipping it on for a large existing codebase all at once usually produces hundreds of errors at once, which is overwhelming and hard to review safely. Migrating module-by-module with the compiler's staged settings lets you fix real races incrementally instead of drowning in noise or reaching for blanket `@unchecked Sendable` escapes.

## Bad

```swift
// Package.swift — flipping every target straight to Swift 6 mode in one PR:
import PackageDescription

let package = Package(
    name: "MyApp",
    targets: [
        .target(name: "CoreModels", swiftSettings: [.swiftLanguageMode(.v6)]),
        .target(name: "LegacyNetworking", swiftSettings: [.swiftLanguageMode(.v6)]),
        .target(name: "UILayer", swiftSettings: [.swiftLanguageMode(.v6)])
    ]
)

// Produces hundreds of new errors across every target at once, causing
// the team to either abandon the migration or blanket-suppress with
// @unchecked Sendable everywhere, defeating the point of doing it.
```

## Good

```swift
// Package.swift — enable strict concurrency per-target, incrementally
import PackageDescription

let package = Package(
    name: "MyApp",
    targets: [
        .target(
            name: "CoreModels",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency")
            ]
        ),
        .target(
            name: "LegacyNetworking"
            // Not yet migrated — left on minimal checking intentionally
        )
    ]
)
```

## A Practical Migration Order

```swift
// 1. Start with leaf modules that have few dependents (models, utilities).
// 2. Make value types Sendable first — usually free (struct/enum + Sendable members).
struct UserID: Sendable, Hashable { let raw: String }

// 3. Convert shared mutable reference types to actors.
actor SessionStore {
    private var token: String?
}

// 4. Mark UI layers @MainActor explicitly rather than relying on inference.
@MainActor
final class ProfileViewModel: ObservableObject { /* ... */ }

// 5. Use @preconcurrency imports for third-party dependencies that haven't
//    migrated yet, so their un-audited APIs don't block your progress.
@preconcurrency import LegacySDK

// 6. Reserve @unchecked Sendable for genuinely hand-verified cases only,
//    and leave a comment explaining the verification — not as a shortcut.
```

Turn on `-warn-concurrency` (Swift 5 mode) before jumping to full Swift 6 mode, so warnings surface early per-module without breaking the build, and fix the underlying races rather than suppressing the warnings.

## See Also

- [`async-sendable-conformance`](async-sendable-conformance.md) - the conformance work most migrations start with
- [`async-actor-isolated-state`](async-actor-isolated-state.md) - converting shared mutable classes to actors
- [`lint-strict-concurrency-complete`](lint-strict-concurrency-complete.md) - enforcing the end state in CI once migrated
