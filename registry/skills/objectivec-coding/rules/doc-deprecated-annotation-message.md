# doc-deprecated-annotation-message

> Annotate deprecated API with `NS_DEPRECATED`/`__deprecated_msg` and a migration note

## Why It Matters

A comment saying "// deprecated, use the new method" produces no compiler warning at call sites, so it gets ignored until the old method is finally deleted and every caller breaks at once. `NS_DEPRECATED`/`__deprecated_msg` turn that into a build-time warning (or error, with warnings-as-errors) that names the replacement right at the call site, in Xcode's own UI.

## Bad

```objc
// DEPRECATED: use -fetchUserWithID:completion: instead
// (No compiler enforcement — nobody sees this until they read the header,
// and even then nothing warns them at each call site.)
- (nullable OMWUser *)fetchUserWithID:(NSString *)userID;
```

## Good

```objc
/**
 Synchronously fetches a user by identifier, blocking the calling thread.
 */
- (nullable OMWUser *)fetchUserWithID:(NSString *)userID
    __deprecated_msg("Use -fetchUserWithID:completion: instead; this "
                      "blocks the calling thread and will be removed "
                      "in OMWKit 5.0.");

/**
 Asynchronously fetches a user by identifier.
 */
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user,
                                     NSError *_Nullable error))completion;
```

## Version-Scoped Deprecation with `NS_DEPRECATED`

```objc
// Deprecated as of iOS 13, introduced in iOS 8. Xcode shows the exact
// OS version range in the deprecation warning.
- (void)presentLegacyShareSheetFromViewController:(UIViewController *)viewController
    NS_DEPRECATED_IOS(8_0, 13_0,
        "Use UIActivityViewController directly, or "
        "OMWShareSheetPresenter for OMWKit-managed presentation.");
```

## Deprecating a Whole Class

```objc
/**
 A legacy synchronous HTTP client.

 @deprecated Use `OMWNetworkClient`, which supports cancellation,
 background sessions, and Swift `async`/`await` bridging.
 */
__attribute__((deprecated("Use OMWNetworkClient instead; scheduled for "
                           "removal in OMWKit 6.0. See MIGRATING.md.")))
@interface OMWLegacyHTTPClient : NSObject
@end
```

## Silencing a Deprecation Warning at a Call Site (Only When Genuinely Needed)

```objc
// Only wrap call sites you cannot yet migrate, and only with a tracking
// note — never blanket-silence deprecation warnings project-wide.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
OMWUser *user = [store fetchUserWithID:userID]; // TODO(OMW-9012): migrate to async API
#pragma clang diagnostic pop
```

## See Also

- [`doc-availability-macros`](doc-availability-macros.md) - Guard platform/version-specific API with availability macros
- [`lint-deprecated-api-warning-enabled`](lint-deprecated-api-warning-enabled.md) - Enable deprecated-API warnings and fix or suppress them explicitly
- [`doc-usage-example-comment`](doc-usage-example-comment.md) - Include a short usage example in the header comment for non-obvious APIs
