# doc-headerdoc-comment-style

> Document public API with HeaderDoc-style `/** ... */` comments

## Why It Matters

Xcode's Quick Help, jump-bar documentation popovers, and `Option`-click summaries are all driven by HeaderDoc-style comment blocks directly above a declaration. Plain `//` comments or no comments at all leave callers (including your future self and any Swift consumer) with an empty Quick Help panel and no discoverable contract for what a method does, what it expects, or what it returns.

## Bad

```objc
// fetches a user, calls back on completion
// note: id can be nil
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *user, NSError *error))completion;

// Just no comment at all — Quick Help shows nothing useful
- (BOOL)validateEmail:(NSString *)email;
```

## Good

```objc
/**
 Fetches a single user profile from the backend.

 @param userID The unique identifier of the user to fetch. Must not be empty.
 @param completion Called on an arbitrary background queue with either a
        populated `OMWUser` and a `nil` error, or a `nil` user and a populated
        `NSError` on failure. Never called with both `nil`.
 */
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *_Nullable user,
                                    NSError *_Nullable error))completion;

/**
 Validates that a string is a syntactically well-formed email address.

 This performs only local, offline syntax validation; it does not verify
 mailbox existence or deliverability.

 @param email The candidate email string.
 @return `YES` if `email` matches RFC 5322's basic address syntax.
 */
- (BOOL)validateEmail:(NSString *)email;
```

## HeaderDoc Field Reference

```objc
/**
 One-sentence summary shown in Quick Help's collapsed view.

 A longer discussion paragraph can follow, describing edge cases,
 side effects, or when to prefer this API over an alternative.

 @param name       Describe each parameter in declaration order.
 @return           Describe the return value; omit for `void` methods.
 @throws           Describe any exception the caller must handle.
 @warning          Call out a sharp edge (e.g., must be called on main thread).
 @see              Point at a related method or type.
 */
```

## Class and Property Documentation

```objc
/**
 A thread-confined cache of recently viewed user profiles.

 All methods must be called from the main thread; `OMWRecentUsersCache`
 performs no internal synchronization.
 */
@interface OMWRecentUsersCache : NSObject

/** The maximum number of profiles retained before the oldest is evicted. */
@property (nonatomic, assign) NSUInteger capacity;

@end
```

## See Also

- [`doc-param-return-tags`](doc-param-return-tags.md) - Document `@param`/`@return` for non-trivial methods
- [`doc-public-header-comments-only`](doc-public-header-comments-only.md) - Put doc comments in the public header, not the implementation
- [`doc-nullability-ownership-documented`](doc-nullability-ownership-documented.md) - Document nullability and ownership expectations in header comments
- [`doc-usage-example-comment`](doc-usage-example-comment.md) - Include a short usage example in the header comment for non-obvious APIs
