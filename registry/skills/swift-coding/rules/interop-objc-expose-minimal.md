# interop-objc-expose-minimal

> Expose only what's needed with `@objc`/`@objcMembers`

## Why It Matters

Every `@objc`-exposed symbol becomes part of your Objective-C ABI surface: it disables certain Swift-only optimizations (generics, structs, protocol extensions can't be exposed at all), inflates the runtime's method table, and locks you into naming/nullability constraints that outlive the original reason for exposing it. Slapping `@objcMembers` on a whole class exposes every property and method transitively, including internals never meant to cross the bridge, which then show up in Objective-C headers and autocomplete as if they were real API. Minimal, explicit exposure keeps the bridge surface auditable and keeps Swift-only members eligible for whole-module optimization.

## Bad

```swift
@objcMembers
class UserSession: NSObject {
    var token: String
    var refreshInterval: TimeInterval
    var internalRetryCount: Int          // never meant for Objective-C callers
    var debugLastRequestBody: Data?      // debug-only, leaked into the header

    init(token: String, refreshInterval: TimeInterval) {
        self.token = token
        self.refreshInterval = refreshInterval
        self.internalRetryCount = 0
    }

    func refresh() { /* ... */ }
    func scheduleBackgroundRetry() { /* Swift-only implementation detail */ }
}
```

## Good

```swift
class UserSession: NSObject {
    @objc var token: String
    @objc var refreshInterval: TimeInterval

    // Internal-only state stays plain Swift: no ABI cost, no header noise.
    private var internalRetryCount = 0
    private var debugLastRequestBody: Data?

    init(token: String, refreshInterval: TimeInterval) {
        self.token = token
        self.refreshInterval = refreshInterval
    }

    @objc func refresh() { /* exposed entry point used by Objective-C caller */ }

    // Swift-only helper: no @objc, no bridging cost, free to use generics/structs.
    private func scheduleBackgroundRetry() { /* ... */ }
}
```

## When `@objcMembers` Is Justified

`@objcMembers` is reasonable on a class whose entire purpose *is* the Objective-C bridge — for example, a thin adapter type consumed exclusively from legacy Objective-C code, where nearly every member needs exposure and per-member `@objc` would be pure noise:

```swift
// Adapter type that exists only to be consumed from Objective-C.
@objcMembers
final class LegacyNotificationAdapter: NSObject {
    var name: String
    var userInfo: [String: Any]
    init(name: String, userInfo: [String: Any]) {
        self.name = name
        self.userInfo = userInfo
    }
}
```

Even then, keep such adapters in their own file, isolated from business logic, so the bridging boundary stays visible and doesn't creep into the rest of the module.

## See Also

- [`interop-bridging-header-minimal`](interop-bridging-header-minimal.md) - the header-side analog of minimal exposure
- [`interop-nullability-annotations`](interop-nullability-annotations.md) - annotate what you do expose correctly
- [`api-access-control-minimal`](api-access-control-minimal.md) - the same narrowest-surface principle for Swift access control
- [`interop-objc-selector-safe`](interop-objc-selector-safe.md) - referencing exposed members safely via `#selector`
