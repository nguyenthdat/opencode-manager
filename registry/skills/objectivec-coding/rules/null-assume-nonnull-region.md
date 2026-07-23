# null-assume-nonnull-region

> Wrap headers in `NS_ASSUME_NONNULL_BEGIN`/`END`

## Why It Matters

Without a nonnull default, every parameter and return type in a header is nullability-unspecified, which Swift bridges as an implicitly-unwrapped optional (`T!`) rather than a real `T` or `T?`. That defeats the entire purpose of nullability annotations: Swift callers get no compiler help distinguishing "always present" from "may be nil," and unannotated ObjC call sites give no static-analyzer coverage for passing `nil` where it isn't expected. Wrapping the whole header in the nonnull region makes "present" the default and forces every actual exception to be marked explicitly.

## Bad

```objc
// OMWUserStore.h - no nonnull region at all
@interface OMWUserStore : NSObject

- (OMWUser *)userWithID:(NSString *)userID;                  // Nullability unspecified everywhere
- (void)saveUser:(OMWUser *)user error:(NSError **)error;     // Swift sees T! for all of these
@property (nonatomic, strong) NSArray<OMWUser *> *cachedUsers;

@end
// Swift import: func user(withID userID: String!) -> OMWUser!
// Every parameter and return value becomes an implicitly-unwrapped optional.
```

## Good

```objc
// OMWUserStore.h
NS_ASSUME_NONNULL_BEGIN

@interface OMWUserStore : NSObject

- (nullable OMWUser *)userWithID:(NSString *)userID;          // Explicit: lookup may legitimately fail
- (BOOL)saveUser:(OMWUser *)user error:(NSError **)error;
@property (nonatomic, copy, readonly) NSArray<OMWUser *> *cachedUsers;  // Always present, non-optional

@end

NS_ASSUME_NONNULL_END
// Swift import: func user(withID userID: String) -> OMWUser?
// Real Optional only where the API actually documents nil is possible.
```

## Scope: One Region Per Header, Not Per Declaration

```objc
// Cover the entire file's declarations with a single BEGIN/END pair; don't
// scatter multiple regions unless a specific section (e.g. a C function
// block) genuinely needs different defaults - see null-audited-region-c-api.
NS_ASSUME_NONNULL_BEGIN

@interface OMWNetworkClient : NSObject
- (void)fetchDataWithCompletion:(void (^)(NSData *_Nullable data,
                                            NSError *_Nullable error))completion;
@end

@protocol OMWNetworkClientDelegate <NSObject>
- (void)networkClient:(OMWNetworkClient *)client didFailWithError:(NSError *)error;
@end

NS_ASSUME_NONNULL_END
```

## Implementation Files Benefit Too

```objc
// OMWUserStore.m
NS_ASSUME_NONNULL_BEGIN

@interface OMWUserStore ()
@property (nonatomic, strong) NSMutableDictionary<NSString *, OMWUser *> *storage;  // Private, still audited
@end

NS_ASSUME_NONNULL_END
```

## See Also

- [`null-explicit-nullable`](null-explicit-nullable.md) - Mark exceptions to the nonnull default with `nullable`/`_Nullable`
- [`null-audited-region-c-api`](null-audited-region-c-api.md) - Wrap nullability-audited C function regions explicitly
- [`interop-nullability-drives-optionals`](interop-nullability-drives-optionals.md) - Use accurate nullability annotations since they determine Swift `Optional` bridging
