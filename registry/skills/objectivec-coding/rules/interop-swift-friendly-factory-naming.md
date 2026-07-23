# interop-swift-friendly-factory-naming

> Name factory methods so they import as Swift initializers, not free functions

## Why It Matters

Clang's Swift importer recognizes a specific naming pattern — a class method starting with the class name and returning `instancetype` (e.g. `+userWithName:`) — and automatically imports it as a Swift initializer (`User(name:)`). A factory method that doesn't match this pattern (wrong prefix, doesn't return `instancetype`, or an unrelated verb) imports instead as an oddly-named static method, which reads foreign to Swift callers used to `Type(...)` construction syntax.

## Bad

```objc
@interface OMWUser : NSObject

// Doesn't start with the class name and isn't phrased as "with" — the
// Swift importer has no pattern to recognize here, so it imports
// literally as: OMWUser.make(name: String) -> OMWUser
+ (instancetype)make:(NSString *)name;

// Returns id instead of instancetype — even with the right name shape,
// the importer is less likely to synthesize a clean initializer, and
// subclasses lose covariant return typing too.
+ (id)userWithName:(NSString *)name;

@end
```

## Good

```objc
@interface OMWUser : NSObject

// Class-name prefix ("user") + "With" + instancetype: the Swift
// importer recognizes this exact shape and imports it as
// User(name:) rather than a static factory method.
+ (instancetype)userWithName:(NSString *)name;

@end
```

```swift
// Swift callers get natural initializer syntax:
let user = OMWUser(name: "Alex")
// instead of the free-function-flavored:
let user = OMWUser.userWithName("Alex")
```

## Multiple Designated-Looking Factories Import as Multiple Initializers

```objc
@interface OMWUser : NSObject

+ (instancetype)userWithName:(NSString *)name;
// Swift: OMWUser(name:)

+ (instancetype)userWithName:(NSString *)name email:(NSString *)email;
// Swift: OMWUser(name:email:)

@end
```

## Use `NS_SWIFT_NAME(init(...))` When the Method Shape Doesn't Naturally Qualify

```objc
@interface OMWImageFilter : NSObject

// "filterNamed:" doesn't match the class-name-prefix pattern
// ("OMWImageFilter" vs "filter"), so force the initializer mapping
// explicitly instead of leaving it to the naming heuristic.
+ (instancetype)filterNamed:(NSString *)name
    NS_SWIFT_NAME(init(named:));

@end
```

## See Also

- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
- [`api-class-factory-method`](api-class-factory-method.md) - Provide `+ classWith...` convenience factory methods
- [`null-instancetype-init`](null-instancetype-init.md) - Return `instancetype`, not the literal class name, from initializers/factories
