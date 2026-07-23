# interop-ns-swift-unavailable

> Hide ObjC-only API from Swift with `NS_SWIFT_UNAVAILABLE`

## Why It Matters

Some Objective-C APIs simply have no safe or meaningful Swift equivalent — raw `va_list` variadic methods, manual-reference-counting helpers, or C-array-backed initializers that assume patterns Swift's type system doesn't support. Left unmarked, these still show up in Swift autocomplete and compile (often unsafely); `NS_SWIFT_UNAVAILABLE` removes them from the Swift-visible surface entirely, with a clear message explaining what to use instead.

## Bad

```objc
// This variadic method is meaningless from Swift (no varargs bridging),
// but with no annotation Swift still sees it as a callable, oddly-typed
// method, and picking it from autocomplete leads to a confusing error.
- (void)logWithFormat:(NSString *)format, ... ;

// A C-array initializer that assumes manual bounds tracking Swift
// callers have no safe way to satisfy.
- (instancetype)initWithRawBytes:(const uint8_t *)bytes length:(NSUInteger)length;
```

## Good

```objc
@interface OMWLogger : NSObject

// Hidden from Swift entirely, with guidance toward the Swift-friendly
// alternative that actually exists.
- (void)logWithFormat:(NSString *)format, ...
    NS_SWIFT_UNAVAILABLE("Use -log(_:) with a pre-formatted String from Swift.");

// Still available to Objective-C callers, unaffected by the annotation.
- (void)log:(NSString *)message;

@end
```

## Hiding an Entire Legacy Type

```objc
// The whole class exists only to bridge pre-ARC/manual-refcount C code
// and has no safe Swift usage pattern at all.
NS_SWIFT_UNAVAILABLE("OMWLegacyBufferWrapper is Objective-C only; "
                      "use Data or UnsafeRawBufferPointer from Swift.")
@interface OMWLegacyBufferWrapper : NSObject
@end
```

## Hiding One Overload While Keeping Another

```objc
@interface OMWImageProcessor : NSObject

// The raw-pointer overload is unsafe from Swift; hide it and point at
// the Data-based overload that Swift can call safely.
- (UIImage *)processImageWithBytes:(const uint8_t *)bytes
                             length:(NSUInteger)length
    NS_SWIFT_UNAVAILABLE("Use -processImageWithData: from Swift.");

- (UIImage *)processImageWithData:(NSData *)data;

@end
```

## Distinguish From `NS_SWIFT_NAME`/`NS_REFINED_FOR_SWIFT`

```objc
// NS_SWIFT_UNAVAILABLE: no Swift-visible form should exist at all.
// NS_SWIFT_NAME: a Swift-visible form should exist, just renamed.
// NS_REFINED_FOR_SWIFT: a Swift-visible form should exist, but wrapped
// by a hand-written Swift overlay rather than imported directly.
// Pick exactly one per method based on whether Swift should see it raw,
// see it renamed, see it wrapped, or not see it at all.
```

## See Also

- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
- [`interop-ns-refined-for-swift`](interop-ns-refined-for-swift.md) - Use `NS_REFINED_FOR_SWIFT` to wrap a low-level ObjC API with a nicer Swift overlay
- [`interop-avoid-macros-in-public-api`](interop-avoid-macros-in-public-api.md) - Avoid preprocessor macros in public API surface since macros don't bridge to Swift
