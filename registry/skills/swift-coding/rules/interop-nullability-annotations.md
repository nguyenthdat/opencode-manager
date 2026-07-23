# interop-nullability-annotations

> Annotate Objective-C headers with `nullable`/`nonnull`

## Why It Matters

Without nullability annotations, every Objective-C pointer imports into Swift as an implicitly unwrapped optional (`Foo!`), because the compiler has no way to know whether `nil` is a valid value. That forces Swift callers to either force-unwrap (crashing on unexpected `nil`) or defensively unwrap everything (noisy code for parameters that are actually guaranteed non-nil). `nullable`/`nonnull` (or `NS_ASSUME_NONNULL_BEGIN`/`END`) let the importer generate proper `Foo?` vs `Foo` types, which is the difference between Swift callers getting real optional-safety and getting a false sense of it.

## Bad

```objc
// UserProfileService.h — no nullability audited
@interface UserProfileService : NSObject

- (void)fetchProfile:(NSString *)userID
           completion:(void (^)(UserProfile *profile, NSError *error))completion;

@property (nonatomic, strong) UserProfile *cachedProfile;

@end
```

```swift
// Everything imports as implicitly unwrapped — false safety
service.fetchProfile(userID: "42") { profile, error in
    print(profile.displayName) // profile is UserProfile! — crashes if fetch failed
}
```

## Good

```objc
// UserProfileService.h
NS_ASSUME_NONNULL_BEGIN

@interface UserProfileService : NSObject

- (void)fetchProfile:(NSString *)userID
           completion:(void (^)(UserProfile *_Nullable profile,
                                 NSError *_Nullable error))completion;

@property (nonatomic, strong, nullable) UserProfile *cachedProfile;

@end

NS_ASSUME_NONNULL_END
```

```swift
// Swift now sees the real optionality
service.fetchProfile(userID: "42") { profile, error in
    guard let profile else {
        // handle error — the compiler forces this branch to exist
        return
    }
    print(profile.displayName)
}
```

## Auditing an Existing Header

Wrap the whole interface in `NS_ASSUME_NONNULL_BEGIN`/`END` first (this makes every unannotated pointer default to `nonnull`), then go back and mark the genuinely optional cases `_Nullable`/`nullable` explicitly — completion-handler results, cached/lazy properties, and anything that can legitimately be absent:

```objc
NS_ASSUME_NONNULL_BEGIN

@interface ImageLoader : NSObject
// nonnull by default under NS_ASSUME_NONNULL_BEGIN
- (instancetype)initWithBaseURL:(NSURL *)baseURL;

// explicitly nullable: no image on cache miss
- (nullable UIImage *)cachedImage:(NSString *)key;
@end

NS_ASSUME_NONNULL_END
```

Never leave a mixed header (`NS_ASSUME_NONNULL_BEGIN` on some declarations, absent on others) — Swift consumers should never have to guess which convention applies to which method.

## See Also

- [`interop-bridging-header-minimal`](interop-bridging-header-minimal.md) - keep the header this annotates minimal
- [`interop-objc-expose-minimal`](interop-objc-expose-minimal.md) - minimize what needs annotating in the first place
- [`type-iuo-boundary-only`](type-iuo-boundary-only.md) - what to do with the IUOs unannotated headers produce
- [`interop-ns-error-domain`](interop-ns-error-domain.md) - nullability of the `NSError **` out-parameter pattern
