# name-factory-method-matches-class

> Name class factory methods after the type they return

## Why It Matters

A class-side convenience constructor is only discoverable if its name tells you what it returns. Cocoa's own factories (`+[NSArray arrayWithObjects:]`, `+[UIColor colorWithRed:green:blue:alpha:]`) all follow `+ <lowercasedClassName>With...`, and Swift's importer relies on this exact pattern to turn the method into an idiomatic `init(...)` call. A factory named after something other than its return type breaks both expectations.

## Bad

```objc
@interface OMWUser : NSObject
+ (instancetype)create:(NSString *)name;             // "create" doesn't say what it creates
+ (instancetype)make:(NSString *)name email:(NSString *)email;  // Generic, unclear
+ (instancetype)build;                                // Reads like a builder, not a factory
@end
```

## Good

```objc
@interface OMWUser : NSObject
+ (instancetype)userWithName:(NSString *)name;
+ (instancetype)userWithName:(NSString *)name email:(NSString *)email;
+ (instancetype)guestUser;
@end

@implementation OMWUser

+ (instancetype)userWithName:(NSString *)name {
    return [self userWithName:name email:nil];
}

+ (instancetype)userWithName:(NSString *)name email:(NSString *)email {
    return [[self alloc] initWithName:name email:email];
}

+ (instancetype)guestUser {
    return [self userWithName:@"Guest" email:nil];
}

@end
```

## Matching Apple's Own Pattern Exactly

```objc
// Foundation examples this convention is derived from:
// + [NSString stringWithFormat:]
// + [NSArray arrayWithObjects:count:]
// + [NSNumber numberWithInteger:]

@interface OMWColorPalette : NSObject
+ (instancetype)paletteWithPrimaryColor:(UIColor *)primary
                          secondaryColor:(UIColor *)secondary;
@end

// Swift bridges this to: OMWColorPalette(primaryColor:secondaryColor:)
// because the importer recognizes "paletteWith..." as matching the class name.
```

## When `self`, Not the Class Name, Belongs in the Factory Body

```objc
@implementation OMWUser

// Use `self` (not `OMWUser`) inside the factory so subclasses inherit correct behavior
+ (instancetype)userWithName:(NSString *)name {
    return [[self alloc] initWithName:name email:nil];  // [self alloc], not [OMWUser alloc]
}

@end

@interface OMWAdminUser : OMWUser
@end
// [OMWAdminUser userWithName:@"Root"] now correctly returns an OMWAdminUser
```

## See Also

- [`name-init-with-prefix`](name-init-with-prefix.md) - Name initializers `initWith...`
- [`null-instancetype-init`](null-instancetype-init.md) - Return `instancetype`, not the literal class name, from initializers/factories
- [`interop-ns-swift-name-rename`](interop-ns-swift-name-rename.md) - Use `NS_SWIFT_NAME` to give Swift an idiomatic name for an Objective-C API
