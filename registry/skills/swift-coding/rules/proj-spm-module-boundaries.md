# proj-spm-module-boundaries

> Use Swift Package Manager targets for module boundaries

## Why It Matters

A single monolithic app target with internal "layers" enforced only by folder naming has no compiler-enforced boundary: any file can import any other file's internals, and nothing stops a `Views` file from reaching directly into a `Persistence` implementation detail. Splitting a project into SPM targets makes module boundaries real — `internal` truly means invisible outside the target, circular dependencies between targets are a build error instead of a code-review nitpick, and each target gets its own incremental compilation unit, cutting rebuild times as the codebase grows.

## Bad

```
MyApp/
  Sources/
    MyApp/
      Views/ProfileView.swift
      ViewModels/ProfileViewModel.swift
      Networking/APIClient.swift
      Persistence/Database.swift        // nothing stops ProfileView from importing this directly
```

```swift
// ProfileView.swift — no compiler boundary preventing this
import SwiftUI

struct ProfileView: View {
    var body: some View {
        Text(Database.shared.fetchUser().name)  // reaches straight past the view model
    }
}
```

## Good

```swift
// Package.swift
let package = Package(
    name: "MyApp",
    platforms: [.iOS(.v17)],
    products: [.library(name: "MyApp", targets: ["AppFeature"])],
    targets: [
        .target(name: "Persistence"),
        .target(name: "Networking"),
        .target(name: "AppFeature", dependencies: ["Networking", "Persistence"]),
        .testTarget(name: "AppFeatureTests", dependencies: ["AppFeature"])
    ]
)
```

```swift
// ProfileView.swift — in the AppFeature target
import SwiftUI
import Networking   // explicit, compiler-checked dependency

struct ProfileView: View {
    let viewModel: ProfileViewModel
    var body: some View {
        Text(viewModel.userName)   // Persistence is not imported here — cannot reach it
    }
}
```

Because `Persistence` isn't a dependency of the view layer at all, the compiler rejects any attempt to `import Persistence` from a file that shouldn't have it — the boundary is structural, not just conventional.

## Choosing Target Granularity

Split along genuine dependency direction (what depends on what), not by file type. A good signal a boundary is worth a target: two areas of the app are developed/tested independently, or one needs to be reused (e.g., shared between an app and an extension, or between iOS and macOS targets):

```swift
targets: [
    .target(name: "DomainModels"),                                   // no dependencies
    .target(name: "Networking", dependencies: ["DomainModels"]),
    .target(name: "Persistence", dependencies: ["DomainModels"]),
    .target(name: "AppFeature", dependencies: ["Networking", "Persistence"]),
    .target(name: "WidgetExtension", dependencies: ["DomainModels", "Persistence"])
]
```

## See Also

- [`proj-flat-small-package`](proj-flat-small-package.md) - don't over-split small packages prematurely
- [`proj-internal-by-default`](proj-internal-by-default.md) - what to expose across the target boundaries you create
- [`proj-target-test-mirror`](proj-target-test-mirror.md) - test targets should mirror this same target structure
- [`api-access-control-minimal`](api-access-control-minimal.md) - access control within a target complements module boundaries between targets
