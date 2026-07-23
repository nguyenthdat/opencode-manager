# kvc-valueforkey-nil-safety

> Handle `nil`/`NSNull` correctly with `valueForKey:`/`setValue:forKey:`

## Why It Matters

`setValue:forKey:` with a `nil` value on a property backed by a scalar (`NSInteger`, `BOOL`, `CGFloat`, a C struct) calls `-setNilValueForKey:`, whose default implementation raises `NSInvalidArgumentException` - a crash, not a graceful no-op. Symmetrically, JSON-derived dictionaries represent "no value" as `NSNull`, not `nil`, so code that checks `value == nil` after a `valueForKey:` lookup on such a dictionary silently misses the case entirely and stores an `NSNull` instance into a property expecting a real object.

## Bad

```objc
@interface OMWInvoice : NSObject
@property (nonatomic, assign) NSInteger quantity; // Scalar, not an object.
@end

- (void)applyUpdates:(NSDictionary<NSString *, id> *)updates {
    for (NSString *key in updates) {
        // If updates[@"quantity"] is nil (or NSNull from a parsed JSON
        // payload), this either crashes (nil -> scalar) or silently
        // stores an NSNull object into an object-typed property.
        [self setValue:updates[key] forKey:key];
    }
}
```

## Good

```objc
@interface OMWInvoice : NSObject
@property (nonatomic, assign) NSInteger quantity;
@property (nonatomic, copy, nullable) NSString *notes;
@end

@implementation OMWInvoice

// Handle the nil-into-scalar case explicitly instead of crashing.
- (void)setNilValueForKey:(NSString *)key {
    if ([key isEqualToString:@"quantity"]) {
        self.quantity = 0;
        return;
    }
    [super setNilValueForKey:key];
}

- (void)applyUpdates:(NSDictionary<NSString *, id> *)updates {
    for (NSString *key in updates) {
        id value = updates[key];
        // Normalize NSNull (from JSON) to nil before handing it to KVC.
        id normalizedValue = (value == (id)[NSNull null]) ? nil : value;
        [self setValue:normalizedValue forKey:key];
    }
}

@end
```

## Reading Values Defensively Too

```objc
- (nullable NSString *)noteTextFromDictionary:(NSDictionary<NSString *, id> *)dict {
    id value = [dict valueForKey:@"note"];
    if (value == nil || value == (id)[NSNull null]) {
        return nil;
    }
    if (![value isKindOfClass:[NSString class]]) {
        return nil; // Defensive: malformed payload shouldn't crash a cast.
    }
    return (NSString *)value;
}
```

## A Small Reusable Helper

```objc
// Centralizing this check avoids scattering `== (id)[NSNull null]`
// comparisons across every call site (see kvc-dictionary-literal-nil-guard
// and null-avoid-nsnull-sentinel-sprawl for the sprawl this prevents).
static inline id OMWNilIfNull(id _Nullable value) {
    return (value == nil || value == (id)[NSNull null]) ? nil : value;
}
```

## See Also

- [`kvc-dictionary-literal-nil-guard`](kvc-dictionary-literal-nil-guard.md) - Guard against `nil` values before building `@{}` dictionary literals
- [`null-avoid-nsnull-sentinel-sprawl`](null-avoid-nsnull-sentinel-sprawl.md) - Centralize `NSNull` sentinel handling instead of scattering checks
- [`err-nested-error-wrapping`](err-nested-error-wrapping.md) - Wrap underlying errors via `NSUnderlyingErrorKey` instead of discarding them
