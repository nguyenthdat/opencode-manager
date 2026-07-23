# anti-category-method-override

> Don't override an existing method from a category (undefined behavior)

## Why It Matters

Categories add methods to an existing class at the Objective-C runtime level by merging their method lists into the class's dispatch table, and if a category defines a method with the same selector as one already on the class (or on another loaded category), the runtime does not merge or warn — it picks whichever implementation happens to load last, an order that depends on link order and is effectively unspecified. The result is a method that behaves differently across builds, across Xcode versions, or between an app target and a unit test bundle that links things in a different order, with no compiler diagnostic to point at the cause.

## Bad

```objc
// OMWFoundation category. NSString already implements -description
// (NSObject's default). This category redefines it, silently replacing
// whichever -description implementation the runtime loads last.
@interface NSString (OMWDebugDescription)
@end

@implementation NSString (OMWDebugDescription)

- (NSString *)description {
    return [NSString stringWithFormat:@"<Custom: %@>", self];
    // Undefined which -description wins if another category (from a
    // third-party library, or Apple's own private category) also
    // overrides -description on NSString -- whichever links last wins,
    // and that order is not something you control or can rely on.
}

@end
```

## Good

```objc
// Add a distinctly-named method instead of overriding an existing one.
// No collision is possible because the selector is unique to your code.
@interface NSString (OMWDebugDescription)
- (NSString *)omw_debugDescription;
@end

@implementation NSString (OMWDebugDescription)

- (NSString *)omw_debugDescription {
    return [NSString stringWithFormat:@"<Custom: %@>", self];
}

@end
```

## Prefer a Subclass When Override Semantics Are Genuinely Needed

```objc
// If you actually need to change -description's behavior for objects
// you create (not for every NSString in the process), subclass
// instead -- subclass method overrides are well-defined and dispatch
// correctly regardless of link order.
@interface OMWDebugString : NSString
@end

@implementation OMWDebugString

- (NSString *)description {
    return [NSString stringWithFormat:@"<OMWDebugString: %@>", [super description]];
}

@end
```

## Detecting an Accidental Override

```objc
// A category that unintentionally overrides an inherited method
// produces this runtime warning (visible in the Xcode console, not a
// compile-time error) -- treat it as a build-breaking signal, not
// noise to scroll past:
// "OMWFoundation.framework/OMWFoundation: Class NSString is implemented
//  in both ?? and ??. One of the two will be used. Which one is undefined."
```

## See Also

- [`api-category-extend-not-override`](api-category-extend-not-override.md) - Use categories to add methods; never override existing methods via category
- [`api-class-extension-private-api`](api-class-extension-private-api.md) - Hide private properties/methods in a class-extension (anonymous category)
- [`name-verbose-descriptive`](name-verbose-descriptive.md) - Prefer verbose, descriptive names over cryptic abbreviations
