# proj-conditional-compilation-platform

> Use `#if os()`/`#if canImport()` for platform-conditional code

## Why It Matters

Cross-platform Swift code (a package shared between iOS, macOS, and a Linux server target, or app code shared with a watchOS/visionOS extension) inevitably needs a handful of platform-specific branches — `UIKit` vs `AppKit`, an API only available above a certain OS version, a capability absent on server-side Swift. Guarding those branches with `#if os()`/`#if canImport()` lets the compiler strip out inapplicable code per platform at compile time (no runtime cost, no missing-symbol link errors), while runtime checks (`if ProcessInfo...`) still require the unavailable API to compile on every platform, which it often can't.

## Bad

```swift
import UIKit   // fails to compile at all on macOS/Linux targets

struct ThemeProvider {
    static var backgroundColor: UIColor {
        UIColor.systemBackground
    }
}
```

## Good

```swift
#if canImport(UIKit)
import UIKit
#elseif canImport(AppKit)
import AppKit
#endif

struct ThemeProvider {
    #if canImport(UIKit)
    static var backgroundColor: UIColor { .systemBackground }
    #elseif canImport(AppKit)
    static var backgroundColor: NSColor { .windowBackgroundColor }
    #endif
}
```

## `#if os()` vs `#if canImport()`

Prefer `canImport(Module)` when the branch is really about whether a *framework* is available (works correctly across current and future platforms that happen to have/lack that framework); use `os(name)` only when the logic genuinely depends on the operating system itself rather than a specific API's availability:

```swift
#if os(iOS) || os(tvOS)
let idiom = UIDevice.current.userInterfaceIdiom
#endif

#if canImport(Combine)
import Combine
// Combine is unavailable on Linux — canImport guards it correctly there too
#endif
```

## Combining With `@available` for OS-Version Gating

`#if os()`/`canImport()` gate on platform/framework presence at compile time; `@available`/`if #available` gate on OS *version* at both compile and run time — use both together when a platform-specific API also has a minimum-version requirement:

```swift
#if canImport(UIKit)
import UIKit

@available(iOS 17, *)
func applyGlassEffect(to view: UIView) {
    view.layer.cornerCurve = .continuous
}
#endif
```

## See Also

- [`proj-package-swift-tools-version`](proj-package-swift-tools-version.md) - declaring the platform minimums these conditionals branch against
- [`interop-foundation-value-types`](interop-foundation-value-types.md) - Foundation availability differences across platforms
- [`proj-spm-module-boundaries`](proj-spm-module-boundaries.md) - isolating platform-specific code into its own target instead of conditionals, when the split is large
