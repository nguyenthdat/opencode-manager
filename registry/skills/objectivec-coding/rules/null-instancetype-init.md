# null-instancetype-init

> Return `instancetype`, not the literal class name, from initializers/factories

## Why It Matters

`instancetype` tells the compiler "this method returns whatever type it was invoked on," which is essential for subclassing: an initializer or factory declared to return the literal class name gives the wrong static type when called through a subclass, silently disabling compiler checks (and, for Swift, breaking the mapping to the subclass's initializer entirely). `instancetype` is resolved at the call site, so `[OMWUserSubclass userWithName:@"Ada"]` is correctly typed as `OMWUserSubclass *`, not `OMWUser *`.

## Bad

```objc
@interface OMWUser : NSObject
+ (OMWUser *)userWithName:(NSString *)name;   // Fixed return type, ignores the calling class
- (OMWUser *)init;                             // Same problem for -init
@end

@interface OMWAdminUser : OMWUser
@end

// Elsewhere:
OMWAdminUser *admin = [OMWAdminUser userWithName:@"Root"];
// Compiler thinks this expression has type OMWUser*, not OMWAdminUser*, even
// though the factory correctly returns an OMWAdminUser instance at runtime.
// Any OMWAdminUser-only property access on the result requires an explicit cast.
```

## Good

```objc
@interface OMWUser : NSObject
+ (instancetype)userWithName:(NSString *)name;  // Resolves to the calling class's type
- (instancetype)init;
@end

@interface OMWAdminUser : OMWUser
@end

// Elsewhere:
OMWAdminUser *admin = [OMWAdminUser userWithName:@"Root"];
// Compiler correctly infers OMWAdminUser*, no cast needed, and Swift imports
// this as a proper `OMWAdminUser(name:)`-style initializer/factory.
```

## Implementation Uses `[self ...]`, Not the Literal Class

```objc
@implementation OMWUser

+ (instancetype)userWithName:(NSString *)name {
    return [[self alloc] initWithName:name];  // `self` here is the receiving class, not OMWUser literally
}

- (instancetype)initWithName:(NSString *)name {
    self = [super init];
    if (self) {
        _name = [name copy];
    }
    return self;
}

@end
```

## Why This Matters More for Swift Bridging

```objc
// A factory method returning instancetype and named appropriately bridges to
// a real Swift initializer:
+ (instancetype)userWithName:(NSString *)name NS_SWIFT_NAME(init(name:));
// Swift: let user = OMWUser(name: "Ada")
// If the return type were the literal OMWUser* instead of instancetype, this
// factory would still work for OMWUser itself, but any subclass initializer
// generated from it would be mistyped.
```

## See Also

- [`api-designated-initializer`](api-designated-initializer.md) - Mark the one true initializer `NS_DESIGNATED_INITIALIZER`
- [`api-class-factory-method`](api-class-factory-method.md) - Provide `+ classWith...` convenience factory methods
- [`name-init-with-prefix`](name-init-with-prefix.md) - Name initializers `initWith...`
