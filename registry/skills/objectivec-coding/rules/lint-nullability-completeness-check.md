# lint-nullability-completeness-check

> Enable `-Wnullable-to-nonnull-conversion` and related nullability warnings

## Why It Matters

Nullability annotations (`NS_ASSUME_NONNULL_BEGIN`, `nullable`, `_Nonnull`) are only enforced if the corresponding compiler warnings are turned on; otherwise they're decorative comments that Swift interop reads but the Objective-C compiler itself never checks. Without `-Wnullable-to-nonnull-conversion` enabled, you can pass a `nullable` value into a `nonnull` parameter and the compiler stays silent, defeating the entire point of annotating nullability in the first place — the crash happens at runtime instead of being caught at compile time.

## Bad

```
// Nullability build warnings left off, so annotations are unenforced.
CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION = NO
```

```objc
// OMWUserStore.h
NS_ASSUME_NONNULL_BEGIN
@interface OMWUserStore : NSObject
- (void)saveUser:(OMWUser *)user;   // implicitly nonnull
@end
NS_ASSUME_NONNULL_END
```

```objc
// OMWUserStore.m -- silently compiles despite passing a nullable value
// into a nonnull parameter, because the warning that would catch this
// is disabled.
- (void)refreshFromCache:(OMWUserCache *)cache {
    OMWUser *_Nullable maybeUser = [cache cachedUser];
    [self saveUser:maybeUser];   // Should warn: nullable -> nonnull.
                                  // Crashes downstream if cache is empty.
}
```

## Good

```
// Shared.xcconfig
CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION = YES
CLANG_ANALYZER_NONNULL = YES
GCC_TREAT_WARNINGS_AS_ERRORS = YES
```

```objc
// Same call site now produces a hard compiler error, forcing an
// explicit nil check before the value crosses the nonnull boundary.
- (void)refreshFromCache:(OMWUserCache *)cache {
    OMWUser *_Nullable maybeUser = [cache cachedUser];
    if (maybeUser == nil) {
        return;
    }
    [self saveUser:maybeUser];   // Now provably nonnull at this point.
}
```

## Auditing a Whole Header at Once

```objc
// Wrapping a header in NS_ASSUME_NONNULL_BEGIN/END and enabling the
// warning surfaces every unannotated exception in one pass, rather
// than discovering them one crash at a time.
NS_ASSUME_NONNULL_BEGIN

@interface OMWImageLoader : NSObject
- (void)loadImageAtURL:(NSURL *)url
             completion:(void (^)(UIImage *_Nullable image,
                                    NSError *_Nullable error))completion;
@end

NS_ASSUME_NONNULL_END
```

## See Also

- [`null-assume-nonnull-region`](null-assume-nonnull-region.md) - Wrap headers in `NS_ASSUME_NONNULL_BEGIN`/`END`
- [`null-explicit-nullable`](null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
- [`anti-unvalidated-nonnull-violation`](anti-unvalidated-nonnull-violation.md) - Don't pass `nil` across a `nonnull` boundary and hope for the best
