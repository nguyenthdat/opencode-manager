# lint-warnings-as-errors-build-setting

> Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds

## Why It Matters

A warning that doesn't block the build gets ignored the moment there's schedule pressure, and warning counts only ever grow — nobody circles back to fix a "harmless" warning once the build is green. `GCC_TREAT_WARNINGS_AS_ERRORS` converts every enabled warning into a hard build failure, which is the only mechanism that reliably keeps a warning count at zero over the life of a project instead of accumulating into an unreadable wall of noise that hides the one warning that actually mattered.

## Bad

```objc
// OMWSession.m compiles with warnings that nobody notices because the
// build still goes green:
- (void)configureWithOptions:(NSDictionary *)options {
    NSString *token = options[@"token"];   // warning: passing 'id' where
                                             // a more specific type may
                                             // be expected (implicit cast)
    int retryCount = options[@"retries"];   // warning: incompatible pointer
                                              // to integer conversion
    self.delegate = nil;                    // warning: unused result on a
                                              // previous line got scrolled
                                              // past in build output
}
```

```
// Build settings: warnings are enabled but not enforced.
GCC_WARN_UNUSED_VARIABLE = YES
CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION = YES
GCC_TREAT_WARNINGS_AS_ERRORS = NO   // Nothing stops this from merging.
```

## Good

```
// CI.xcconfig -- applied only to the CI build configuration so local
// development builds can still show (but not block on) warnings while
// iterating, but nothing merges with an unresolved warning.
GCC_TREAT_WARNINGS_AS_ERRORS = YES
CLANG_WARN_NULLABLE_TO_NONNULL_CONVERSION = YES
GCC_WARN_UNUSED_VARIABLE = YES
CLANG_WARN_STRICT_PROTOTYPES = YES
CLANG_WARN_DOCUMENTATION_COMMENTS = YES
```

```objc
// The same file now fails the CI build immediately, forcing a fix
// before merge instead of a silent accumulation of type mismatches.
- (void)configureWithOptions:(NSDictionary<NSString *, id> *)options {
    NSString *token = [options[@"token"] isKindOfClass:[NSString class]]
        ? options[@"token"]
        : nil;
    NSNumber *retriesNumber = options[@"retries"];
    NSInteger retryCount = retriesNumber.integerValue;
    self.delegate = nil;
}
```

## Escaping a Specific Warning Deliberately

```objc
// When a warning is a genuine, reviewed false positive rather than a
// bug, silence it narrowly and explain why -- never disable the
// warning class wholesale.
#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated-declarations"
// OMWLegacyBridge intentionally calls a deprecated Core Location API
// to preserve behavior on iOS 13, which lacks the replacement.
CLLocationManager *manager = [[CLLocationManager alloc] init];
[manager requestWhenInUseAuthorization];
#pragma clang diagnostic pop
```

## See Also

- [`lint-deprecated-api-warning-enabled`](lint-deprecated-api-warning-enabled.md) - Enable deprecated-API warnings and fix or suppress them explicitly
- [`lint-clang-static-analyzer-ci`](lint-clang-static-analyzer-ci.md) - Run the Clang Static Analyzer in CI
- [`lint-unused-variable-warning`](lint-unused-variable-warning.md) - Enable and fix unused-variable/unused-import warnings
