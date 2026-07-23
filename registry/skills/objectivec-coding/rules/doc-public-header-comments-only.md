# doc-public-header-comments-only

> Put doc comments in the public header, not the implementation

## Why It Matters

Xcode's Quick Help, jump-to-definition popovers, and generated documentation all read the comment attached to the declaration Clang indexes — which is the one in the `.h` file. A HeaderDoc comment written above the `.m` implementation is invisible to every consumer of the API and gets silently skipped by documentation generators, giving a false sense that the API is documented.

## Bad

```objc
// OMWUserStore.h
@interface OMWUserStore : NSObject
- (nullable OMWUser *)userWithID:(NSString *)userID;
@end

// OMWUserStore.m
/**
 Looks up a cached user by identifier.
 @param userID The user's unique identifier.
 @return The cached user, or nil if not present.
 */
// This comment is dead weight: Quick Help on the header never sees it,
// and callers importing only the header get zero documentation.
- (nullable OMWUser *)userWithID:(NSString *)userID {
    return self.usersByID[userID];
}
```

## Good

```objc
// OMWUserStore.h
/**
 Looks up a cached user by identifier.

 @param userID The user's unique identifier.
 @return The cached user, or `nil` if no user with that identifier has
         been loaded into the cache.
 */
- (nullable OMWUser *)userWithID:(NSString *)userID;

// OMWUserStore.m
// Implementation notes that matter only to maintainers stay here as a
// plain comment, not HeaderDoc — no @param/@return duplication.
- (nullable OMWUser *)userWithID:(NSString *)userID {
    // Dictionary lookup is O(1); userID is expected to already be
    // normalized (lowercased) by the caller in OMWUserIDNormalizer.
    return self.usersByID[userID];
}
```

## Implementation-Only Comments Should Explain "Why", Not Restate the Contract

```objc
- (void)invalidateCacheIfStale {
    // Deliberately using a 5-minute TTL instead of the 1-minute default
    // here: profile photos rarely change and re-fetching them is the
    // most expensive part of a cache refresh. See OMW-4821.
    if ([self.lastRefresh timeIntervalSinceNow] < -300) {
        [self reload];
    }
}
```

## Private/Internal Headers Still Get Doc Comments

```objc
// OMWUserStore+Private.h (imported only by implementation files)
/**
 Rebuilds the in-memory index from the on-disk cache file.

 Internal use only; called from `-init` and after a cache-invalidation
 notification. Not part of the public API surface.
 */
- (void)rebuildIndexFromDisk;
```

## See Also

- [`doc-headerdoc-comment-style`](doc-headerdoc-comment-style.md) - Document public API with HeaderDoc-style `/** ... */` comments
- [`proj-header-implementation-split`](proj-header-implementation-split.md) - Split public interface (`.h`) from implementation (`.m`)
- [`proj-private-headers-separate`](proj-private-headers-separate.md) - Keep private/internal headers out of the public framework header directory
