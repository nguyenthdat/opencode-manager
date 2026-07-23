# null-explicit-nullable

> Mark exceptions to the nonnull default with `nullable`/`_Nullable`

## Why It Matters

Inside an `NS_ASSUME_NONNULL_BEGIN` region, every unannotated type is treated as nonnull. If a parameter, return value, or property can genuinely be `nil` and you forget to mark it `nullable`, the compiler and Swift both believe `nil` is impossible there: Swift generates a non-optional type, so callers can't even check for `nil`, and passing `nil` from Objective-C triggers a `-Wnonnull` warning (or a runtime trap in some contexts) instead of being handled as a normal case.

## Bad

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageCache : NSObject

// This can legitimately return nil on a cache miss, but nothing says so -
// the compiler assumes nonnull, and Swift imports this as non-optional UIImage.
- (UIImage *)cachedImageForKey:(NSString *)key;

@property (nonatomic, strong) NSError *lastError;  // Often nil (no error yet), but not marked nullable

@end

NS_ASSUME_NONNULL_END
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageCache : NSObject

- (nullable UIImage *)cachedImageForKey:(NSString *)key;   // Explicit: nil on cache miss

@property (nonatomic, strong, nullable) NSError *lastError; // Explicit: nil until a failure occurs

@end

NS_ASSUME_NONNULL_END
```

## Underscore Form for Parameters and Blocks

```objc
// Plain `nullable` works for property/method return positions; parameters
// and block-type components more often use the underscore-prefixed spelling
// so it reads naturally next to the pointer:
- (void)fetchImageForKey:(NSString *)key
               completion:(void (^)(UIImage *_Nullable image, NSError *_Nullable error))completion;

// Both spellings are equivalent; `nullable` is preferred for whole
// declarations, `_Nullable` for inline positions like block parameters.
```

## Nullable Collection Element Types

```objc
// Nullability can attach to the generic parameter itself, not just the
// outer collection:
@property (nonatomic, copy) NSArray<OMWUser *_Nullable> *usersWithMaybeDeletedPlaceholders;
// vs a collection that is itself optional but whose elements are guaranteed present:
@property (nonatomic, copy, nullable) NSArray<OMWUser *> *searchResults;  // nil until a search runs
```

## See Also

- [`null-assume-nonnull-region`](null-assume-nonnull-region.md) - Wrap headers in `NS_ASSUME_NONNULL_BEGIN`/`END`
- [`interop-nullability-drives-optionals`](interop-nullability-drives-optionals.md) - Use accurate nullability annotations since they determine Swift `Optional` bridging
- [`anti-unvalidated-nonnull-violation`](anti-unvalidated-nonnull-violation.md) - Don't pass `nil` across a `nonnull` boundary and hope for the best
