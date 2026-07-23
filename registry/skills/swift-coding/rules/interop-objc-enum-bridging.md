# interop-objc-enum-bridging

> Bridge `NS_ENUM`/`NS_OPTIONS` to Swift enums/option sets correctly

## Why It Matters

`NS_ENUM` and `NS_OPTIONS` are both plain C integer typedefs in Objective-C, but they mean very different things in Swift: `NS_ENUM` bridges to an exhaustive `enum` with one case active at a time, while `NS_OPTIONS` bridges to an `OptionSet` struct representing a bitmask where values combine. Declaring a bitmask type as `NS_ENUM` (or vice versa) either produces a Swift API that can't express combined flags at all, or produces cases that silently accept nonsensical raw values because the bridging machinery assumed the wrong shape.

## Bad

```objc
// Declared as NS_ENUM even though the values are independent bit flags
typedef NS_ENUM(NSUInteger, UIRenderOptions) {
    UIRenderOptionAntialiased = 1 << 0,
    UIRenderOptionHighQuality = 1 << 1,
    UIRenderOptionAsync      = 1 << 2,
};
```

```swift
// Swift sees a plain enum — can't combine flags, callers resort to raw values
func render(options: UIRenderOptions) { /* ... */ }

render(options: UIRenderOptions(rawValue: 3)!)  // "3" means nothing at the call site
```

## Good

```objc
// Bitmask semantics declared correctly as NS_OPTIONS
typedef NS_OPTIONS(NSUInteger, UIRenderOptions) {
    UIRenderOptionAntialiased = 1 << 0,
    UIRenderOptionHighQuality = 1 << 1,
    UIRenderOptionAsync      = 1 << 2,
};
```

```swift
// Swift sees a real OptionSet — combinable, self-documenting
func render(options: UIRenderOptions) { /* ... */ }

render(options: [.antialiased, .highQuality])
```

## Bridging a Mutually Exclusive Value Correctly

Use `NS_ENUM` (bridges to a Swift `enum`) whenever the values are mutually exclusive states, not combinable flags:

```objc
typedef NS_ENUM(NSInteger, ConnectionState) {
    ConnectionStateDisconnected,
    ConnectionStateConnecting,
    ConnectionStateConnected,
};
```

```swift
// Bridges to a real Swift enum: exhaustive switch, no combining nonsense
switch connection.state {
case .disconnected: reconnect()
case .connecting: showSpinner()
case .connected: showContent()
@unknown default: break   // future-proofs against new cases added upstream
}
```

Always include `@unknown default` when switching over an imported Objective-C enum — the framework can add cases in a future SDK release without it being a source-breaking change on the Objective-C side, and `@unknown default` is what surfaces that as a Swift warning instead of a silent gap.

## See Also

- [`interop-nullability-annotations`](interop-nullability-annotations.md) - the header-annotation discipline this pairs with
- [`type-enum-associated-values`](type-enum-associated-values.md) - modeling exclusive state natively in Swift
- [`interop-ns-error-domain`](interop-ns-error-domain.md) - `NS_ERROR_ENUM`, the error-specific variant of `NS_ENUM` bridging
