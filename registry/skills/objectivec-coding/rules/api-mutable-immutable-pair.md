# api-mutable-immutable-pair

> Provide an immutable base class plus a mutable subclass, mirroring `NSString`/`NSMutableString`

## Why It Matters

Foundation's `NSString`/`NSMutableString`, `NSArray`/`NSMutableArray`, and `NSDictionary`/`NSMutableDictionary` split is not incidental — it lets an API return a value that callers can safely hold onto and share without it changing out from under them, while still supporting a genuinely mutable variant where one is actually needed. Exposing only a single mutable class for a value-like type forces every property that holds one to `copy` defensively (see `arc-copy-value-objects`) and makes accidental external mutation of shared state a constant risk.

## Bad

```objc
// Only one, inherently mutable, "point set" type - anyone holding a
// reference can mutate it underneath any other holder.
@interface OMWPointSet : NSObject
@property (nonatomic, readonly) NSUInteger count;
- (void)addPoint:(CGPoint)point;
- (void)removePointAtIndex:(NSUInteger)index;
- (CGPoint)pointAtIndex:(NSUInteger)index;
@end

// A "getter" hands back the live, mutable instance - caller can corrupt state
@interface OMWPath : NSObject
@property (nonatomic, readonly) OMWPointSet *points;
@end

OMWPointSet *points = path.points;
[points addPoint:CGPointMake(1, 1)];  // Silently mutates OMWPath's internal state too
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

// Immutable base class - safe to hand out, share, and store without copying
@interface OMWPointSet : NSObject <NSCopying, NSMutableCopying>

@property (nonatomic, readonly) NSUInteger count;
- (instancetype)initWithPoints:(const CGPoint *)points count:(NSUInteger)count NS_DESIGNATED_INITIALIZER;
- (CGPoint)pointAtIndex:(NSUInteger)index;

@end

// Mutable subclass - opt-in, used only where mutation is actually needed
@interface OMWMutablePointSet : OMWPointSet

- (void)addPoint:(CGPoint)point;
- (void)removePointAtIndex:(NSUInteger)index;

@end

@interface OMWPath : NSObject
@property (nonatomic, copy, readonly) OMWPointSet *points;  // `copy` + immutable base = safe to expose directly
@end

NS_ASSUME_NONNULL_END

OMWPointSet *points = path.points;         // Immutable - no mutating methods exist to call
OMWMutablePointSet *editable = [points mutableCopy];  // Opt into mutability explicitly, on a private copy
[editable addPoint:CGPointMake(1, 1)];     // Only mutates the private copy, not path's internal state
```

## Implementing `-mutableCopyWithZone:`

```objc
@implementation OMWPointSet

- (id)copyWithZone:(nullable NSZone *)zone {
    return self;  // Immutable objects can safely return themselves from -copy
}

- (id)mutableCopyWithZone:(nullable NSZone *)zone {
    OMWMutablePointSet *copy = [[OMWMutablePointSet alloc] initWithPoints:_points count:_count];
    return copy;  // Mutable copy is always a fresh, independent instance
}

@end
```

## See Also

- [`arc-copy-value-objects`](arc-copy-value-objects.md) - Why `copy` properties matter even without a mutable/immutable pair
- [`anti-mutable-public-property`](anti-mutable-public-property.md) - Don't expose a mutable collection property directly
- [`null-generic-mutable-subclass`](null-generic-mutable-subclass.md) - Preserving generics across the mutable subclass boundary
