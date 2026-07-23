# name-enum-case-type-prefix

> Prefix `NS_ENUM` cases with the enclosing type's name

## Why It Matters

Enum cases live in the same global namespace as everything else in Objective-C — an unprefixed case like `Pending` or `Active` will collide with any other enum, constant, or macro in the program that happens to share the name. Prefixing every case with the enum's own type name (`OMWOrderStatusPending`) removes the ambiguity, matches every Apple-defined `NS_ENUM` (`UITableViewCellStyleDefault`, `NSTextAlignmentLeft`), and gives Swift's importer what it needs to strip the redundant prefix into a clean `case pending` when bridging.

## Bad

```objc
typedef NS_ENUM(NSInteger, OMWOrderStatus) {
    Pending,      // Bare case names pollute the global namespace
    Shipped,
    Delivered,
    Cancelled,
};
```

## Good

```objc
typedef NS_ENUM(NSInteger, OMWOrderStatus) {
    OMWOrderStatusPending,
    OMWOrderStatusShipped,
    OMWOrderStatusDelivered,
    OMWOrderStatusCancelled,
};
```

## `NS_OPTIONS` Bitmasks Follow the Same Rule, Plus Explicit Shift Values

```objc
typedef NS_OPTIONS(NSUInteger, OMWDocumentPermissions) {
    OMWDocumentPermissionNone   = 0,
    OMWDocumentPermissionRead   = 1 << 0,
    OMWDocumentPermissionWrite  = 1 << 1,
    OMWDocumentPermissionShare  = 1 << 2,
    OMWDocumentPermissionAll    = OMWDocumentPermissionRead
                                | OMWDocumentPermissionWrite
                                | OMWDocumentPermissionShare,
};
```

## How the Prefix Bridges Cleanly to Swift

```objc
// Objective-C
typedef NS_ENUM(NSInteger, OMWOrderStatus) {
    OMWOrderStatusPending,
    OMWOrderStatusShipped,
};
```

```swift
// Swift import (automatic, because every case shares the "OMWOrderStatus" prefix)
enum OMWOrderStatus: Int {
    case pending
    case shipped
}
```

If cases don't share a common prefix, Swift cannot safely strip it and imports the ugly, un-truncated case names verbatim instead.

## See Also

- [`name-camelcase-convention`](name-camelcase-convention.md) - Use `lowerCamelCase` for methods/properties, `UpperCamelCase` for types/protocols
- [`name-class-prefix-framework`](name-class-prefix-framework.md) - Prefix classes with a 2-3 letter code when shipping a library/framework
- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
