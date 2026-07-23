# interop-ns-refined-for-swift

> Use `NS_REFINED_FOR_SWIFT` to wrap a low-level ObjC API with a nicer Swift overlay

## Why It Matters

Some Objective-C APIs are shaped around C idioms Swift can express more safely and idiomatically — an `NSError **` out-parameter that could be `throws`, a `BOOL` return plus separate value that could be a single `Optional`/`Result`, or an untyped `id` that could be a generic. `NS_REFINED_FOR_SWIFT` renames the ObjC method with a leading underscore in Swift and lets you write a small Swift extension in an overlay file that presents the ergonomic version, while keeping the original for ObjC callers unchanged.

## Bad

```objc
// Without NS_REFINED_FOR_SWIFT, Swift imports this exactly as declared:
//   store.__value(forKey: String) -> Any?
// Callers get a raw Any? and must force-cast, and there's no natural
// place to add a generic, type-safe Swift wrapper.
@interface OMWSettingsStore : NSObject
- (nullable id)valueForKey:(NSString *)key;
@end
```

## Good

```objc
// OMWSettingsStore.h
@interface OMWSettingsStore : NSObject

// Swift sees this as `__value(forKey:)` — deliberately name-mangled so
// it's clearly the "raw" entry point, not the one Swift callers should
// reach for directly.
- (nullable id)valueForKey:(NSString *)key NS_REFINED_FOR_SWIFT;

@end
```

```swift
// OMWSettingsStore+Swift.swift (hand-written overlay, ships alongside the framework)
extension OMWSettingsStore {
    /// Type-safe accessor built on top of the refined ObjC entry point.
    func value<T>(forKey key: String, as type: T.Type) -> T? {
        return __value(forKey: key) as? T
    }
}

// Swift callers get the nice generic version:
let timeout: Int? = settings.value(forKey: "timeoutSeconds", as: Int.self)
```

## Refining an `NSError **` Method into a `throws` Overlay

```objc
// OMWFileImporter.h
- (nullable OMWDocument *)importDocumentAtURL:(NSURL *)url
                                          error:(NSError **)error
    NS_REFINED_FOR_SWIFT;
```

```swift
// OMWFileImporter+Swift.swift
extension OMWFileImporter {
    func importDocument(at url: URL) throws -> OMWDocument {
        var error: NSError?
        guard let document = __importDocument(at: url, error: &error) else {
            throw error ?? OMWImportError.unknown
        }
        return document
    }
}
```

## When Plain `NS_SWIFT_NAME` Is Enough

```objc
// If the ObjC signature already maps cleanly onto an idiomatic Swift
// shape (no out-params, no untyped id, no C-style boolean-plus-value
// pairs), just rename it — don't reach for NS_REFINED_FOR_SWIFT when
// there's no real shape mismatch to paper over.
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable, NSError *_Nullable))completion
    NS_SWIFT_NAME(fetchUser(id:completion:));
```

## See Also

- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
- [`interop-error-domain-bridges-to-swift-error`](interop-error-domain-bridges-to-swift-error.md) - Design `NSError` domains/codes to bridge cleanly to a Swift `Error` enum
- [`interop-generics-bridge-to-swift`](interop-generics-bridge-to-swift.md) - Use lightweight generics so collections bridge to typed Swift arrays/dictionaries
