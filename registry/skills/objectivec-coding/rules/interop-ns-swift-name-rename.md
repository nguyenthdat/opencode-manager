# interop-ns-swift-name-rename

> Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API

## Why It Matters

Objective-C's keyword-argument selector style (`fetchUserWithID:completion:`) doesn't map onto Swift's argument-label conventions automatically in a way that always reads well, and some ObjC names (`NS`-prefixed globals, C-style free functions, redundant type-name prefixes) look outright unidiomatic once imported verbatim. `NS_SWIFT_NAME` lets the Objective-C author control the imported Swift signature directly, instead of leaving Swift callers stuck with an awkward auto-generated name.

## Bad

```objc
// Imports into Swift as the clunky, redundantly-prefixed:
//   OMWUser.fetchUser(withID: String, completion: ...)
// with no NS_SWIFT_NAME, Swift derives a name mechanically from the
// selector and doesn't know "User" is already implied by the receiver.
@interface OMWUserStore : NSObject
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user,
                                     NSError *_Nullable error))completion;
@end

// A free function imports as a global, polluting the Swift namespace:
// OMWStringIsValidEmail(_:) instead of a nicer member-like call.
BOOL OMWStringIsValidEmail(NSString *email);
```

## Good

```objc
@interface OMWUserStore : NSObject

// Imports into Swift as:
//   store.fetchUser(id: String, completion: @escaping (User?, Error?) -> Void)
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user,
                                     NSError *_Nullable error))completion
    NS_SWIFT_NAME(fetchUser(id:completion:));

@end

// Renaming a free function so it imports as a static member instead of
// a bare global: OMWEmailValidator.isValid(_:)
BOOL OMWStringIsValidEmail(NSString *email)
    NS_SWIFT_NAME(OMWEmailValidator.isValid(self:));
```

## Renaming an Entire Type

```objc
// NS_SWIFT_NAME on a type drops a redundant prefix for Swift consumers,
// since Swift already namespaces by module — Swift sees just "User".
NS_SWIFT_NAME(User)
@interface OMWUser : NSObject
@property (nonatomic, copy, readonly) NSString *displayName;
@end
```

## Renaming Initializers to Read Naturally as Swift Initializers

```objc
@interface OMWImageFilter : NSObject

// Imports as: OMWImageFilter(named: "sepia") instead of
// OMWImageFilter.filterNamed("sepia") — matches Swift's own
// initializer-call convention.
+ (instancetype)filterNamed:(NSString *)name
    NS_SWIFT_NAME(init(named:));

@end
```

## See Also

- [`interop-swift-friendly-factory-naming`](interop-swift-friendly-factory-naming.md) - Name factory methods so they import as Swift initializers, not free functions
- [`interop-swift-name-enum-cases`](interop-swift-name-enum-cases.md) - Use `NS_SWIFT_NAME` on `NS_ENUM` cases for idiomatic Swift case names
- [`interop-ns-swift-unavailable`](interop-ns-swift-unavailable.md) - Hide ObjC-only API from Swift with `NS_SWIFT_UNAVAILABLE`
