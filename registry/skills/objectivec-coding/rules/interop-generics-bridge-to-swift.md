# interop-generics-bridge-to-swift

> Use lightweight generics so collections bridge to typed Swift arrays/dictionaries

## Why It Matters

A bare `NSArray *`/`NSDictionary *` imports into Swift as `[Any]`/`[AnyHashable: Any]`, forcing every Swift caller to conditionally downcast each element before using it. Declaring lightweight generics (`NSArray<OMWUser *> *`) on the Objective-C side costs nothing at runtime but lets Swift import the exact same API as `[OMWUser]`/`[String: OMWUser]`, giving Swift callers real compile-time type safety with zero bridging code.

## Bad

```objc
@interface OMWUserStore : NSObject

// Imports into Swift as: func allUsers() -> [Any]
// Every Swift caller must write `as? [OMWUser]` and handle failure,
// even though this method can only ever return OMWUser instances.
- (NSArray *)allUsers;

// Imports as: var usersByID: [AnyHashable: Any]
@property (nonatomic, strong, readonly) NSDictionary *usersByID;

@end
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWUserStore : NSObject

// Imports into Swift as: func allUsers() -> [OMWUser]
// No downcasting needed at the call site.
- (NSArray<OMWUser *> *)allUsers;

// Imports as: var usersByID: [String: OMWUser]
@property (nonatomic, strong, readonly) NSDictionary<NSString *, OMWUser *> *usersByID;

@end

NS_ASSUME_NONNULL_END
```

```swift
// Swift call site — fully typed, no casting:
let users: [OMWUser] = store.allUsers()
let byID: [String: OMWUser] = store.usersByID
for user in users {
    print(user.displayName) // typed as OMWUser directly
}
```

## Generics on Sets and Mutable Collections Too

```objc
@property (nonatomic, strong, readonly) NSSet<NSString *> *tagNames;
@property (nonatomic, strong, readonly) NSMutableArray<OMWMessage *> *pendingMessages;
```

## Lightweight Generics Are Erased at Runtime — They're a Compile-Time/Bridging Contract Only

```objc
// The compiler and Swift-importer both trust this annotation, but
// nothing at runtime enforces it inside the implementation — an
// incorrectly-typed insert compiles with only a warning in Objective-C.
NSMutableArray<OMWUser *> *users = [NSMutableArray array];
[users addObject:(id)someUnrelatedObject]; // compiles with a warning, not an error

// Because of this, keep insertion points for a generic collection
// tightly controlled (e.g. behind a typed method), so the declared
// generic type is actually accurate for Swift's benefit.
```

## See Also

- [`null-lightweight-generics`](null-lightweight-generics.md) - Parameterize collections with lightweight generics (`NSArray<NSString *> *`)
- [`interop-nullability-drives-optionals`](interop-nullability-drives-optionals.md) - Use accurate nullability annotations since they determine Swift `Optional` bridging
- [`null-generic-mutable-subclass`](null-generic-mutable-subclass.md) - Preserve declared generics on mutable collection subclass return types
