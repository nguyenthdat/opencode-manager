# interop-nullability-drives-optionals

> Use accurate nullability annotations since they determine Swift `Optional` bridging

## Why It Matters

Every `nonnull`/`nullable` annotation on an Objective-C declaration becomes the literal difference between a Swift `Type` and `Type?` at the call site — there is no separate Swift-side signal to correct a wrong annotation. An inaccurate `nonnull` forces Swift callers to force-unwrap or force-cast a value that can genuinely be nil, turning a recoverable Objective-C nil-check into a Swift runtime crash.

## Bad

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageCache : NSObject

// Marked (implicitly, via NS_ASSUME_NONNULL_BEGIN) as nonnull, but the
// implementation genuinely returns nil on a cache miss. Swift imports
// this as `-> UIImage` (non-optional), so Swift callers can't even
// check for a miss — they get a bridging crash on first read instead.
- (UIImage *)cachedImageForKey:(NSString *)key;

@end

NS_ASSUME_NONNULL_END
```

## Good

```objc
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageCache : NSObject

// Explicitly nullable: Swift imports this as `-> UIImage?`, and the
// cache-miss case becomes an ordinary `if let` in Swift, matching what
// the implementation actually does.
- (nullable UIImage *)cachedImageForKey:(NSString *)key;

@end

NS_ASSUME_NONNULL_END
```

```swift
// Swift call site with the correct annotation:
if let image = cache.cachedImage(forKey: "avatar") {
    imageView.image = image
} else {
    // ordinary, expected cache-miss path — no crash, no force-unwrap
}
```

## Auditing Existing Declarations Before Annotating

```objc
// Before writing `nonnull`, actually check every return path.
- (nullable NSString *)normalizedPhoneNumber:(NSString *)raw {
    if (raw.length == 0) {
        return nil; // <- this path means the method cannot be nonnull
    }
    return [self.formatter normalize:raw];
}
```

## Nullability on Block Parameters Bridges Too

```objc
// A block parameter's nullability determines whether Swift's closure
// signature uses optional or non-optional parameter/return types.
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user,
                                     NSError *_Nullable error))completion;
// Swift: completion: @escaping (OMWUser?, Error?) -> Void
```

## `_Null_unspecified` Is a Migration Escape Hatch, Not a Default

```objc
// Only use this while auditing legacy code; it imports as an implicitly
// unwrapped optional (`Type!`) in Swift, which defeats the whole point
// of nullability annotations and should be temporary, not a resting state.
- (NSString * _Null_unspecified)legacyUnauditedValue;
```

## See Also

- [`null-explicit-nullable`](null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
- [`null-assume-nonnull-region`](null-assume-nonnull-region.md) - Wrap headers in `NS_ASSUME_NONNULL_BEGIN`/`END`
- [`interop-generics-bridge-to-swift`](interop-generics-bridge-to-swift.md) - Use lightweight generics so collections bridge to typed Swift arrays/dictionaries
