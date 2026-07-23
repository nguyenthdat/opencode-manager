# doc-availability-macros

> Guard platform/version-specific API with availability macros

## Why It Matters

Calling an API that doesn't exist on an app's minimum deployment target crashes at runtime with an unrecognized-selector or a linker-level symbol failure, but the compiler can catch this at build time if — and only if — the API is annotated with `API_AVAILABLE`/`@available`-style guards. Without them, the only signal is a support ticket from a user on an older OS.

## Bad

```objc
// No availability annotation — compiles cleanly on any deployment target,
// but crashes with "unrecognized selector" on iOS versions below 16.
- (void)configureWithSensitiveContentAnalysis {
    UIImageView *imageView = self.previewImageView;
    imageView.sensitiveContentAnalysisEnabled = YES; // iOS 17+ only API
}
```

## Good

```objc
/**
 Enables on-device sensitive-content analysis for the preview image, on
 platforms that support it.
 */
- (void)configureWithSensitiveContentAnalysis API_AVAILABLE(ios(17.0)) {
    UIImageView *imageView = self.previewImageView;
    imageView.sensitiveContentAnalysisEnabled = YES;
}

// Callers must guard the call site too, since the containing app may
// target a lower deployment target than 17.0:
- (void)applyPreviewConfiguration {
    if (@available(iOS 17.0, *)) {
        [self configureWithSensitiveContentAnalysis];
    } else {
        [self configureWithLegacyContentWarning];
    }
}
```

## Annotating a Whole Class

```objc
/**
 A presenter for the modern, iOS 16+ share sheet configuration APIs.
 */
API_AVAILABLE(ios(16.0))
@interface OMWShareSheetPresenter : NSObject
- (void)presentFromViewController:(UIViewController *)viewController;
@end
```

## Cross-Platform Guards

```objc
// Available on iOS 15+ and macOS 12+, unavailable on watchOS/tvOS.
- (void)startLiveActivity
    API_AVAILABLE(ios(16.1), macCatalyst(16.1))
    API_UNAVAILABLE(watchos, tvos);
```

## Weak-Linking for Optional Frameworks

```objc
// Combine with a runtime class check when an entire framework may be
// absent (e.g. optional Swift Package dependency compiled weak):
if (NSClassFromString(@"OMWMLKitFaceDetector") != nil) {
    // Safe to use, framework is present
} else {
    // Framework not linked at runtime; fall back
}
```

## See Also

- [`doc-deprecated-annotation-message`](doc-deprecated-annotation-message.md) - Annotate deprecated API with `NS_DEPRECATED`/`__deprecated_msg` and a migration note
- [`lint-deprecated-api-warning-enabled`](lint-deprecated-api-warning-enabled.md) - Enable deprecated-API warnings and fix or suppress them explicitly
- [`doc-thread-safety-documented`](doc-thread-safety-documented.md) - State a type's thread-safety guarantees in its header comment
