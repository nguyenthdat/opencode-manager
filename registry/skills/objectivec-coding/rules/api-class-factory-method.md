# api-class-factory-method

> Provide `+ classWith...` convenience factory methods

## Why It Matters

A class-side factory method (`+userWithName:email:`) reads at the call site like a sentence, can be combined with autorelease-friendly patterns, and gives you a single place to add caching, validation, or subclass selection later without changing every call site's syntax from `alloc`/`init` to something else. Cocoa's own frameworks (`+[NSArray arrayWithObjects:]`, `+[NSDate dateWithTimeIntervalSinceNow:]`) establish this as the expected convenience-construction idiom, and omitting it makes an API feel foreign next to the rest of Foundation.

## Bad

```objc
@interface OMWUser : NSObject

- (instancetype)initWithName:(NSString *)name email:(NSString *)email NS_DESIGNATED_INITIALIZER;

@end

// Every call site pays the alloc/init tax and reads less naturally
OMWUser *user = [[OMWUser alloc] initWithName:@"Ada Lovelace" email:@"ada@example.com"];
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWUser : NSObject

- (instancetype)initWithName:(NSString *)name email:(NSString *)email NS_DESIGNATED_INITIALIZER;
- (instancetype)init NS_UNAVAILABLE;

// Convenience factory - matches Cocoa's `+ <lowercase-class>With...:` idiom
+ (instancetype)userWithName:(NSString *)name email:(NSString *)email;

@end

NS_ASSUME_NONNULL_END

@implementation OMWUser

+ (instancetype)userWithName:(NSString *)name email:(NSString *)email {
    return [[self alloc] initWithName:name email:email];  // `self`, not `OMWUser`, so subclasses inherit it correctly
}

- (instancetype)initWithName:(NSString *)name email:(NSString *)email {
    self = [super init];
    if (self) {
        _name = [name copy];
        _email = [email copy];
    }
    return self;
}

@end

// Call site reads naturally, just like Foundation's own factories
OMWUser *user = [OMWUser userWithName:@"Ada Lovelace" email:@"ada@example.com"];
```

## Why `self`, Not the Class Name, Inside the Factory

```objc
@implementation OMWAdminUser : OMWUser

// Because the factory used `[self alloc]`, calling +userWithName:email: on
// OMWAdminUser correctly produces an OMWAdminUser instance, not an OMWUser.
@end

OMWAdminUser *admin = [OMWAdminUser userWithName:@"Root" email:@"root@example.com"];
// admin is genuinely an OMWAdminUser, because the factory used `self`, not `OMWUser`
```

## See Also

- [`api-designated-initializer`](api-designated-initializer.md) - The initializer the factory method delegates to
- [`name-factory-method-matches-class`](name-factory-method-matches-class.md) - Naming factory methods after the returned type
- [`null-instancetype-init`](null-instancetype-init.md) - Returning `instancetype` for correct subclass behavior
