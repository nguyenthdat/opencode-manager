# interop-swift-name-enum-cases

> Use `NS_SWIFT_NAME` on `NS_ENUM` cases for idiomatic Swift case names

## Why It Matters

Swift automatically strips a common type-name prefix from `NS_ENUM` cases when it can detect one, but that heuristic doesn't always match what you'd actually want a Swift `case` to be named, and it fails entirely when the case names aren't uniformly prefixed. `NS_SWIFT_NAME` on each case gives explicit, guaranteed control over the imported Swift enum's case names instead of hoping the automatic prefix-stripping guesses correctly.

## Bad

```objc
// Inconsistent prefixing defeats Swift's automatic stripping heuristic:
// some cases get "AutoStripped" nicely, others end up with the whole
// prefix left in, like `.omwConnectionStateReconnecting`.
typedef NS_ENUM(NSInteger, OMWConnectionState) {
    OMWConnectionStateIdle,
    OMWConnectionStateConnecting,
    OMWConnectionStateReconnecting, // prefix-stripping is inconsistent here
    OMWConnectionStateConnected,
};
```

## Good

```objc
typedef NS_ENUM(NSInteger, OMWConnectionState) {
    OMWConnectionStateIdle NS_SWIFT_NAME(idle),
    OMWConnectionStateConnecting NS_SWIFT_NAME(connecting),
    OMWConnectionStateReconnecting NS_SWIFT_NAME(reconnecting),
    OMWConnectionStateConnected NS_SWIFT_NAME(connected),
};
```

```swift
// Swift sees exactly the intended, guaranteed case names:
switch connection.state {
case .idle: break
case .connecting: break
case .reconnecting: break
case .connected: break
@unknown default: break
}
```

## Renaming a Case to Avoid a Swift Keyword Collision

```objc
// "default" and "self" are Swift keywords; renaming avoids forcing
// Swift callers to write backtick-escaped `` `default` ``.
typedef NS_ENUM(NSInteger, OMWSortOrder) {
    OMWSortOrderDefault NS_SWIFT_NAME(standard),
    OMWSortOrderReversed NS_SWIFT_NAME(reversed),
};
```

## `NS_OPTIONS` Cases Can Be Renamed the Same Way

```objc
typedef NS_OPTIONS(NSUInteger, OMWCacheOptions) {
    OMWCacheOptionsNone            = 0,
    OMWCacheOptionsSkipMemoryCache NS_SWIFT_NAME(skipMemoryCache) = 1 << 0,
    OMWCacheOptionsSkipDiskCache   NS_SWIFT_NAME(skipDiskCache)   = 1 << 1,
};
```

## See Also

- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
- [`name-enum-case-type-prefix`](name-enum-case-type-prefix.md) - Prefix `NS_ENUM` cases with the enclosing type's name
- [`interop-nullability-drives-optionals`](interop-nullability-drives-optionals.md) - Use accurate nullability annotations since they determine Swift `Optional` bridging
