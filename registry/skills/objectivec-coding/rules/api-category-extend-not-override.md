# api-category-extend-not-override

> Use categories to add methods; never override existing methods via category

## Why It Matters

Objective-C's runtime has exactly one method table per selector per class; when a category redefines a method that already exists (in the original class or another category), the resulting behavior depends on link/load order and is officially undefined. Categories are meant to *add* new methods to a class (including ones you don't own, like `NSString` or `UIView`), not to patch over or "monkey-patch" existing ones — that use case belongs to subclassing or, if it truly must intercept an existing implementation, deliberate method swizzling with clear documentation.

## Bad

```objc
// NSString+OMWTrimming.m
@implementation NSString (OMWTrimming)

// DANGER: -description already exists on NSString. Which implementation wins
// is undefined and can silently change between OS/SDK versions or link order.
- (NSString *)description {
    return [NSString stringWithFormat:@"<Trimmed: %@>", self];
}

@end
```

## Good

```objc
// NSString+OMWTrimming.h
NS_ASSUME_NONNULL_BEGIN

@interface NSString (OMWTrimming)

// New method, doesn't exist anywhere in NSString's class hierarchy - safe.
- (NSString *)omw_trimmedString;

@end

NS_ASSUME_NONNULL_END

// NSString+OMWTrimming.m
@implementation NSString (OMWTrimming)

- (NSString *)omw_trimmedString {
    return [self stringByTrimmingCharactersInSet:[NSCharacterSet whitespaceAndNewlineCharacterSet]];
}

@end

// Call site - clearly an addition, not a silent behavior change
NSString *clean = [@"  hello  " omw_trimmedString];
```

## Prefix Category Methods to Avoid Collisions

```objc
// Even new methods can collide with a THIRD PARTY's category on the same
// class. Prefix category-added selectors, just like class names.
@interface UIView (OMWLayout)
- (void)omw_pinToSuperviewEdges;   // Prefixed - safe from collision with another library's -pinToSuperviewEdges
@end
```

## If You Truly Need to Intercept Existing Behavior

```objc
// This is method swizzling, not a category override - it must be explicit,
// documented, done once (e.g. +load or a dispatch_once), and is a deliberate
// exception, not a routine category use.
+ (void)load {
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        Method original = class_getInstanceMethod(self, @selector(viewDidLoad));
        Method swizzled = class_getInstanceMethod(self, @selector(omw_swizzled_viewDidLoad));
        method_exchangeImplementations(original, swizzled);
    });
}
```

## See Also

- [`anti-category-method-override`](anti-category-method-override.md) - The anti-pattern this rule guards against
- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Class extensions vs. categories
- [`name-verbose-descriptive`](name-verbose-descriptive.md) - Naming conventions that also help avoid collisions
