# name-notification-name-constant

> Export notification names as `NSNotificationName` constants, not string literals

## Why It Matters

A notification name typed as a raw `@"..."` string literal has no compiler-enforced link between the poster and the observer: a single typo in either place produces a notification that silently never fires and never fails to compile. Declaring the name as an exported `NSNotificationName` constant makes the compiler catch typos, gives Xcode "Jump to Definition"/autocomplete on the name, and matches the type Apple's own `NSNotificationCenter` API expects.

## Bad

```objc
// Poster
[[NSNotificationCenter defaultCenter] postNotificationName:@"UserDidLogInNotification"
                                                      object:self];

// Observer, in a completely different file
[[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(handleLogin:)
                                              name:@"UserDidLoggedInNotification"  // Typo! Silently never fires.
                                            object:nil];
```

## Good

```objc
// OMWUserSession.h
NS_ASSUME_NONNULL_BEGIN
FOUNDATION_EXPORT NSNotificationName const OMWUserSessionDidLogInNotification;
NS_ASSUME_NONNULL_END

// OMWUserSession.m
NSNotificationName const OMWUserSessionDidLogInNotification = @"OMWUserSessionDidLogInNotification";
```

```objc
// Poster
[[NSNotificationCenter defaultCenter] postNotificationName:OMWUserSessionDidLogInNotification
                                                      object:self];

// Observer - the compiler errors if this constant name is misspelled, since it doesn't exist
[[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(handleLogin:)
                                              name:OMWUserSessionDidLogInNotification
                                            object:nil];
```

## Including `userInfo` Keys in the Same Namespaced Constant Set

```objc
FOUNDATION_EXPORT NSNotificationName const OMWUserSessionDidLogInNotification;
FOUNDATION_EXPORT NSString *const OMWUserSessionUserInfoKey;      // key into userInfo dictionary
FOUNDATION_EXPORT NSString *const OMWUserSessionTimestampInfoKey;

// Posting with typed userInfo keys
[[NSNotificationCenter defaultCenter]
    postNotificationName:OMWUserSessionDidLogInNotification
                   object:self
                 userInfo:@{
                     OMWUserSessionUserInfoKey: loggedInUser,
                     OMWUserSessionTimestampInfoKey: [NSDate date],
                 }];
```

## See Also

- [`name-constant-namespaced`](name-constant-namespaced.md) - Namespace exported constants with the owning type's name
- [`anti-stringly-typed-notifications`](anti-stringly-typed-notifications.md) - Don't use raw string literals for notification names/userInfo keys
- [`kvc-notification-block-observer-token`](kvc-notification-block-observer-token.md) - Prefer block-based `NSNotificationCenter` observers and keep the removal token
