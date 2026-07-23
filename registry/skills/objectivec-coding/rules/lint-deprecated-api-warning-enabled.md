# lint-deprecated-api-warning-enabled

> Enable deprecated-API warnings and fix or suppress them explicitly

## Why It Matters

Deprecated APIs get removed. If deprecated-API warnings are disabled or ignored, the first sign of trouble is a hard compile error (or worse, a runtime crash on a new OS) the day Apple finally deletes the symbol, at a time you don't control and possibly right before a release deadline. Keeping the warning on and addressing each occurrence — either migrating off it or explicitly acknowledging why it's still needed — turns an unpredictable future break into a manageable, reviewed backlog item.

## Bad

```objc
// CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS left off, or the warning
// is silenced globally instead of addressed:
- (void)requestLocationAccess {
    // UIWebView has been deprecated for years and is now rejected by
    // App Store review, but the warning was suppressed project-wide
    // rather than fixed, so nobody noticed it was still here.
    UIWebView *webView = [[UIWebView alloc] initWithFrame:self.view.bounds];
    [self.view addSubview:webView];
}
```

```
// Prefix header or build settings silencing every deprecation warning
// across the whole project instead of the one call site that needs it:
GCC_WARN_ABOUT_DEPRECATED_FUNCTIONS = NO
```

## Good

```
// Shared.xcconfig -- keep deprecation warnings on everywhere.
CLANG_WARN_DEPRECATED_OBJC_IMPLEMENTATIONS = YES
GCC_WARN_ABOUT_DEPRECATED_FUNCTIONS = YES
```

```objc
// Migrated off the deprecated API entirely -- the preferred fix.
- (void)requestLocationAccess {
    WKWebView *webView = [[WKWebView alloc] initWithFrame:self.view.bounds];
    [self.view addSubview:webView];
}
```

## Explicitly Acknowledging an Unavoidable Deprecation

```objc
// When migration genuinely isn't possible yet (e.g. minimum deployment
// target predates the replacement API), suppress narrowly with a
// comment explaining the constraint and a follow-up ticket reference.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
// TODO(OMW-4821): UIAlertView required until deployment target moves
// past iOS 8; remove this suppression when the target bumps to iOS 9+.
UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Error"
                                                  message:message
                                                 delegate:nil
                                        cancelButtonTitle:@"OK"
                                        otherButtonTitles:nil];
[alert show];
#pragma clang diagnostic pop
```

## Marking Your Own API Deprecated

```objc
// OMWLegacyAuthenticator.h -- give consumers of your own library the
// same early warning you rely on from Apple's frameworks.
- (void)authenticateWithUsername:(NSString *)username
                          password:(NSString *)password
    NS_DEPRECATED_IOS(10_0, 13_0, "Use authenticateWithToken: instead");
```

## See Also

- [`lint-warnings-as-errors-build-setting`](lint-warnings-as-errors-build-setting.md) - Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds
- [`doc-deprecated-annotation-message`](doc-deprecated-annotation-message.md) - Annotate deprecated API with `NS_DEPRECATED`/`__deprecated_msg` and a migration note
- [`doc-availability-macros`](doc-availability-macros.md) - Guard platform/version-specific API with availability macros
