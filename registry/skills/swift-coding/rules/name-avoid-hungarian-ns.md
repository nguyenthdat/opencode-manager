# name-avoid-hungarian-ns

> Avoid Hungarian-style type prefixes and gratuitous `NS`-cargo-culting

## Why It Matters

Swift's type system and Xcode's autocomplete make Hungarian notation (`strName`, `bIsValid`, `iCount`) redundant—the compiler already knows and enforces the type. Likewise, prefixing your own Swift types with `NS` (a Foundation/AppKit/Objective-C legacy convention) or a company/module prefix is cargo-culting an Objective-C workaround for its lack of namespaces; Swift modules already namespace your types.

## Bad

```swift
// Hungarian notation: type encoded in the name
struct strUserName {
    var strValue: String
}
var bIsLoggedIn: Bool = false
var iRetryCount: Int = 0
var arrItems: [Item] = []

// Gratuitous NS-prefixing of your own Swift types (no ObjC bridging need)
class NSOrderProcessor {
    func NSCalculateTotal() -> Double { ... }
}

struct MYCOUserProfile { // company-prefix cargo-culted from ObjC
    var name: String
}
```

## Good

```swift
struct UserName {
    var value: String
}
var isLoggedIn: Bool = false
var retryCount: Int = 0
var items: [Item] = []

// Swift modules provide namespacing; no prefix needed.
class OrderProcessor {
    func calculateTotal() -> Double { ... }
}

struct UserProfile {
    var name: String
}
```

## When a Prefix Is Still Warranted

```swift
// Keep NS/UI/CF prefixes only for types that genuinely bridge to
// Objective-C/Foundation/AppKit/UIKit frameworks, or that must avoid
// colliding with an existing Objective-C class of the same bare name
// when exposed via @objc.
@objc(ACMEOrderProcessor)
class OrderProcessor: NSObject {
    // The @objc(...) name is the ObjC-visible name; the Swift name stays plain.
}

// Referencing genuine Foundation types is fine as-is; don't rename them.
let formatter = NumberFormatter()
let request: NSMutableURLRequest? = nil // only if interop truly requires NS-prefixed API
```

## See Also

- [`name-acronym-consistent-case`](name-acronym-consistent-case.md) - Acronym casing conventions
- [`interop-objc-expose-minimal`](interop-objc-expose-minimal.md) - Minimal Objective-C exposure
- [`proj-internal-by-default`](proj-internal-by-default.md) - Relying on module boundaries instead of prefixes
