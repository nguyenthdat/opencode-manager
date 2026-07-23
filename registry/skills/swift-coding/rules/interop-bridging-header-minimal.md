# interop-bridging-header-minimal

> Keep bridging headers minimal and organized

## Why It Matters

A bridging header (`Target-Bridging-Header.h`) is compiled into every Swift file in the target, so every `#import` in it becomes a build-time dependency for the whole module — bloating incremental build times and creating implicit coupling that's invisible from the Swift side. A bridging header that accumulates unrelated legacy headers over time ("just add it here, it compiles") becomes an undocumented map of every Objective-C dependency the Swift code secretly has, making it impossible to reason about what a given Swift file actually needs.

## Bad

```objc
// MyApp-Bridging-Header.h — everything dumped in over two years
#import "LegacyNetworking.h"
#import "OldAnalyticsSDK.h"
#import "CoreDataHelpers.h"
#import "ImageCache.h"
#import "ThirdPartyPaymentSDK.h"
#import "DebugOverlay.h"
#import "UnusedExperimentalFeature.h"   // nobody remembers why this is here
#import "Utils.h"                       // grab-bag header, imports 10 more headers
```

## Good

```objc
// MyApp-Bridging-Header.h
// Only headers that Swift code directly and currently depends on.
// Each import documents a genuine dependency — remove when the caller is removed.

#import "LegacyNetworking.h"      // used by NetworkGateway.swift for migration bridge
#import "ThirdPartyPaymentSDK.h"  // used by PaymentAdapter.swift; no Swift wrapper exists yet
```

Anything not actively bridged gets removed, and each remaining import is commented with why it's there so the next person doesn't have to grep the whole codebase to find out.

## Organizing at Scale: Module Maps Over Bridging Headers

For anything beyond a small app target, prefer wrapping Objective-C code in its own module (a `module.modulemap` or an SPM target with a `public` C/Objective-C header directory) and `import` it like any other Swift dependency, rather than growing the single bridging header further:

```swift
// Package.swift
.target(
    name: "LegacyObjCKit",
    path: "Sources/LegacyObjCKit",
    publicHeadersPath: "include"
),
.target(
    name: "AppFeature",
    dependencies: ["LegacyObjCKit"]   // import LegacyObjCKit in Swift, no bridging header needed
)
```

This scopes the Objective-C dependency to the Swift files that actually `import LegacyObjCKit`, gives per-target incremental builds instead of one shared header, and makes the dependency explicit and greppable instead of implicit.

## See Also

- [`interop-objc-expose-minimal`](interop-objc-expose-minimal.md) - minimize what needs to be imported in the first place
- [`interop-nullability-annotations`](interop-nullability-annotations.md) - annotate the headers the bridging header pulls in
- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - use SPM targets instead of a monolithic bridging header
