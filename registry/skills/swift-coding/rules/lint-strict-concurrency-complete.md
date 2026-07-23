# lint-strict-concurrency-complete

> Set strict concurrency checking to `complete` for new targets

## Why It Matters

Under the default (`minimal`) concurrency checking, a new target can accumulate hundreds of `Sendable`/actor-isolation violations invisibly, because the compiler only flags the most obvious cases — the debt doesn't surface until the target is later migrated to Swift 6 mode, at which point every violation becomes a build-breaking error all at once. Setting `-strict-concurrency=complete` on a *new* target from day one means every data-race-shaped bug is caught incrementally, one PR at a time, as the code is written — never accumulated as an all-at-once migration cliff.

## Bad

```swift
// Package.swift — new target left at the implicit default
.target(
    name: "NewFeature",
    dependencies: ["Networking"]
    // no swiftSettings — concurrency checking defaults to `minimal`
)
```
```swift
// Compiles cleanly today under `minimal`, but is a Sendable violation
// waiting to be discovered the moment this target adopts Swift 6 mode.
final class RequestCache {
    var storage: [String: Data] = [:]   // mutable shared state, no isolation, no Sendable
}
```

## Good

```swift
// Package.swift
.target(
    name: "NewFeature",
    dependencies: ["Networking"],
    swiftSettings: [
        .unsafeFlags(["-strict-concurrency=complete"])
    ]
)
```
```swift
// The compiler now flags this immediately, while it's a two-line fix, not a
// tangle discovered months later during a Swift 6 migration:
actor RequestCache {
    private var storage: [String: Data] = [:]

    func store(_ data: Data, for key: String) { storage[key] = key.isEmpty ? data : data }
    func data(for key: String) -> Data? { storage[key] }
}
```

## Migrating an Existing Target Incrementally

For an existing target already carrying concurrency debt, ramp up through the levels rather than jumping straight to `complete`, fixing the diagnostics surfaced at each stage before moving to the next:

```swift
// Stage 1: targeted — flags only code that opts into concurrency (async/await, actors)
.unsafeFlags(["-strict-concurrency=targeted"])

// Stage 2: complete — flags everything, matching Swift 6 mode's behavior
.unsafeFlags(["-strict-concurrency=complete"])

// Stage 3: adopt the language mode directly (Swift 5.9+ manifest API, tools-version 6.0+)
swiftSettings: [.swiftLanguageMode(.v6)]
```

Resolve each diagnostic with real isolation (`actor`, `@MainActor`, `Sendable` conformance) rather than reaching for `@unchecked Sendable` as a blanket suppressor — that flag should be reserved for genuinely audited, provably safe cases, not a way to silence the check.

## See Also

- [`async-sendable-conformance`](async-sendable-conformance.md) - the conformance work strict checking will require
- [`async-strict-concurrency-migration`](async-strict-concurrency-migration.md) - the incremental migration path for existing targets
- [`anti-data-race-unchecked`](anti-data-race-unchecked.md) - the anti-pattern of disabling checks instead of fixing races
- [`proj-package-swift-tools-version`](proj-package-swift-tools-version.md) - the manifest version required for `.swiftLanguageMode(.v6)`
