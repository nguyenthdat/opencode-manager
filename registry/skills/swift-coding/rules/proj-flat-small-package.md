# proj-flat-small-package

> Keep small packages flat; avoid premature module splitting

## Why It Matters

Splitting a package into a dozen tiny targets before there's a real reason (independent reuse, genuinely separate teams, a real dependency-direction problem) adds `Package.swift` boilerplate, cross-target `import` friction, and extra `public`/`internal` bookkeeping for no actual benefit — and once other code depends on the target boundaries, collapsing them back is a breaking change. A small package (a few thousand lines, one team, one release cadence) is usually better served by a single flat target with folders for organization; split into multiple targets only when a concrete pressure (build time, reuse across apps, enforced layering) justifies the overhead.

## Bad

```swift
// A small utility package split into 6 targets for no functional reason
let package = Package(
    name: "StringHelpers",
    targets: [
        .target(name: "StringHelpersCore"),
        .target(name: "StringHelpersFormatting", dependencies: ["StringHelpersCore"]),
        .target(name: "StringHelpersValidation", dependencies: ["StringHelpersCore"]),
        .target(name: "StringHelpersLocalization", dependencies: ["StringHelpersCore"]),
        .target(name: "StringHelpers", dependencies: [
            "StringHelpersCore", "StringHelpersFormatting",
            "StringHelpersValidation", "StringHelpersLocalization"
        ]),
        .testTarget(name: "StringHelpersTests", dependencies: ["StringHelpers"])
    ]
)
// Total library code: ~400 lines across all four "core" targets.
```

## Good

```swift
// Same functionality, flat structure appropriate to its size
let package = Package(
    name: "StringHelpers",
    products: [.library(name: "StringHelpers", targets: ["StringHelpers"])],
    targets: [
        .target(name: "StringHelpers"),
        .testTarget(name: "StringHelpersTests", dependencies: ["StringHelpers"])
    ]
)
```
```
Sources/StringHelpers/
  Formatting.swift
  Validation.swift
  Localization.swift
```
Folder organization within the single target gives the same navigability without the cross-target `import`/access-control overhead.

## When to Actually Split

Split out a target when one of these becomes concretely true, not hypothetically someday true:

- A subset of the code needs to be reused independently (e.g., a `Models` target shared between an app and a widget extension that shouldn't link full app logic).
- Build time for the whole target is measurably slowing iteration, and the split would let unchanged code skip recompilation.
- You need a real compiler-enforced layering boundary (see `proj-spm-module-boundaries`) because a folder convention has already failed to hold.

```swift
// Justified split: WidgetExtension needs Models but not the full NetworkingKit
targets: [
    .target(name: "Models"),
    .target(name: "NetworkingKit", dependencies: ["Models"]),
    .target(name: "App", dependencies: ["NetworkingKit"]),
    .target(name: "WidgetExtension", dependencies: ["Models"])
]
```

## See Also

- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - when a real boundary justifies a target split
- [`proj-feature-folder-organize`](proj-feature-folder-organize.md) - organize within a flat target by feature
- [`anti-premature-optimization-swift`](anti-premature-optimization-swift.md) - the same "wait for real evidence" principle applied to structure instead of performance
