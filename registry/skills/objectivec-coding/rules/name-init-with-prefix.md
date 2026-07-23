# name-init-with-prefix

> Name initializers `initWith...`

## Why It Matters

Cocoa's runtime and tooling both key off the `init` prefix: ARC recognizes methods starting with `init` as "init family" methods with special ownership semantics (they consume `self` and return a retained object), and Xcode's autocomplete/documentation generation assumes it. An initializer that doesn't start with `init` loses these automatic ARC guarantees and reads unlike every other initializer in the SDK, forcing readers to double check whether it is actually a designated initializer at all.

## Bad

```objc
@interface OMWUser : NSObject

- (instancetype)userWithName:(NSString *)name email:(NSString *)email;  // Not init-family; ARC won't apply init semantics
- (instancetype)createFromDictionary:(NSDictionary *)dict;                // Reads like a factory, but it's actually -init

@end
```

## Good

```objc
@interface OMWUser : NSObject

- (instancetype)initWithName:(NSString *)name
                        email:(NSString *)email NS_DESIGNATED_INITIALIZER;
- (instancetype)initWithDictionary:(NSDictionary<NSString *, id> *)dictionary;
- (instancetype)init NS_UNAVAILABLE;

@end

@implementation OMWUser

- (instancetype)initWithName:(NSString *)name email:(NSString *)email {
    self = [super init];
    if (self) {
        _name = [name copy];
        _email = [email copy];
    }
    return self;
}

- (instancetype)initWithDictionary:(NSDictionary<NSString *, id> *)dictionary {
    return [self initWithName:dictionary[@"name"] email:dictionary[@"email"]];
}

@end
```

## Distinguishing `initWith...` From a Class Factory

```objc
// Instance-side: always initWith..., always returns instancetype from -init
- (instancetype)initWithName:(NSString *)name;

// Class-side: a convenience factory that calls through to initWith...
// Name it after the type it returns, not initWith (it isn't an -init method).
+ (instancetype)userWithName:(NSString *)name;

@implementation OMWUser

+ (instancetype)userWithName:(NSString *)name {
    return [[self alloc] initWithName:name];  // Factory delegates to the real initializer
}

@end
```

## See Also

- [`name-factory-method-matches-class`](name-factory-method-matches-class.md) - Name class factory methods after the type they return
- [`null-instancetype-init`](null-instancetype-init.md) - Return `instancetype`, not the literal class name, from initializers/factories
- [`api-designated-initializer`](api-designated-initializer.md) - Mark the one true initializer `NS_DESIGNATED_INITIALIZER`
