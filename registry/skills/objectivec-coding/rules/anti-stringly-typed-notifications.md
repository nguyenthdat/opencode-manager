# anti-stringly-typed-notifications

> Don't use raw string literals for notification names/userInfo keys

## Why It Matters

A raw string literal used as a notification name or `userInfo` key has no compiler backing at all: a typo in either the poster or the observer (`@"UserDidLogin"` vs `@"UserDidLogIn"`) compiles cleanly and simply never fires the observer, with no warning and no crash — just a feature that silently doesn't work. There's also no single place to find every notification a class posts, and Xcode can't offer autocomplete or "Find All References" across a string literal the way it can for a declared constant.

## Bad

```objc
// OMWSessionManager.m
- (void)handleLoginSuccess {
    [[NSNotificationCenter defaultCenter] postNotificationName:@"UserDidLogin"
                                                          object:self
                                                        userInfo:@{@"userID": self.currentUser.identifier}];
}
```

```objc
// OMWDashboardViewController.m -- a typo three files away that the
// compiler cannot catch.
[[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(userLoggedIn:)
                                              name:@"UserDidLogIn"   // Typo:
                                                                      // "LogIn"
                                                                      // vs
                                                                      // "Login".
                                            object:nil];

- (void)userLoggedIn:(NSNotification *)notification {
    NSString *userID = notification.userInfo[@"userId"];   // Wrong case:
                                                              // "userId" vs
                                                              // "userID".
                                                              // Always nil.
}
```

## Good

```objc
// OMWSessionManager.h
FOUNDATION_EXPORT NSNotificationName const OMWUserDidLoginNotification;
FOUNDATION_EXPORT NSString *const OMWUserDidLoginUserIDKey;
```

```objc
// OMWSessionManager.m
NSNotificationName const OMWUserDidLoginNotification = @"OMWUserDidLoginNotification";
NSString *const OMWUserDidLoginUserIDKey = @"OMWUserDidLoginUserIDKey";

- (void)handleLoginSuccess {
    [[NSNotificationCenter defaultCenter] postNotificationName:OMWUserDidLoginNotification
                                                          object:self
                                                        userInfo:@{OMWUserDidLoginUserIDKey: self.currentUser.identifier}];
}
```

```objc
// OMWDashboardViewController.m -- a typo here is now a compile error,
// not a silent no-op, because the compiler checks the constant name.
[[NSNotificationCenter defaultCenter] addObserver:self
                                          selector:@selector(userLoggedIn:)
                                              name:OMWUserDidLoginNotification
                                            object:nil];

- (void)userLoggedIn:(NSNotification *)notification {
    NSString *userID = notification.userInfo[OMWUserDidLoginUserIDKey];
}
```

## Block-Based Observers Reduce the Same Risk Further

```objc
// Block-based registration keeps the handler next to the constant
// reference, making a name/key mismatch even easier to spot in review.
[[NSNotificationCenter defaultCenter] addObserverForName:OMWUserDidLoginNotification
                                                    object:nil
                                                     queue:[NSOperationQueue mainQueue]
                                                usingBlock:^(NSNotification *note) {
    NSString *userID = note.userInfo[OMWUserDidLoginUserIDKey];
    [self refreshDashboardForUserID:userID];
}];
```

## See Also

- [`name-notification-name-constant`](name-notification-name-constant.md) - Export notification names as `NSNotificationName` constants, not string literals
- [`name-constant-namespaced`](name-constant-namespaced.md) - Namespace exported constants with the owning type's name
- [`kvc-notification-block-observer-token`](kvc-notification-block-observer-token.md) - Prefer block-based `NSNotificationCenter` observers and keep the removal token
