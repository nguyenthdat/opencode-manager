# interop-avoid-macros-in-public-api

> Avoid preprocessor macros in public API surface since macros don't bridge to Swift

## Why It Matters

The preprocessor runs before Clang's semantic analysis, so by the time the Swift importer looks at a header, a `#define`d constant or function-like macro has already been textually substituted away — there's no symbol left for Swift to see at all. A macro-based "constant" or "helper function" in a public header is simply invisible to Swift, forcing consumers to redefine it themselves or hardcode the value.

## Bad

```objc
// A #define constant: Swift sees nothing here at all — no
// OMWDefaultTimeout symbol exists once the preprocessor is done.
#define OMWDefaultTimeout 30.0

// A function-like macro: also invisible to Swift, and unsafe (no type
// checking, double-evaluation risk if x has side effects).
#define OMWClamp(x, low, high) (((x) < (low)) ? (low) : (((x) > (high)) ? (high) : (x)))

// A macro-based "enum": Swift can't bridge this into a real enum type
// at all, since there's no declaration for the importer to see.
#define OMWStatusPending 0
#define OMWStatusActive 1
#define OMWStatusDone 2
```

## Good

```objc
// A real, typed constant — Swift sees `OMWDefaultTimeout: TimeInterval`.
FOUNDATION_EXPORT NSTimeInterval const OMWDefaultTimeout;
// OMWConstants.m: NSTimeInterval const OMWDefaultTimeout = 30.0;

// A real function — Swift sees `OMWClamp(_:low:high:) -> Double`,
// with proper type checking and no double-evaluation surprises.
FOUNDATION_EXPORT double OMWClamp(double value, double low, double high);

// A real NS_ENUM — Swift sees `OMWStatus` as a genuine, switchable enum.
typedef NS_ENUM(NSInteger, OMWStatus) {
    OMWStatusPending = 0,
    OMWStatusActive = 1,
    OMWStatusDone = 2,
};
```

## Macros Are Still Fine Inside Implementation Files

```objc
// OMWLogging.m — never exposed in a public header, so invisibility to
// Swift doesn't matter here at all.
#define OMWLogFunctionEntry() NSLog(@"-> %s", __PRETTY_FUNCTION__)
```

## Compile-Time Feature Switches Belong in Build Settings, Not Public Macros

```objc
// Don't expose conditional-compilation macros as part of a public API
// contract — Swift can't participate in an #ifdef at all.
#ifdef OMW_ENABLE_BETA_FEATURES
// ...
#endif
// Prefer a runtime flag/property instead, which Swift can read and
// branch on normally:
@property (nonatomic, assign, readonly) BOOL betaFeaturesEnabled;
```

## See Also

- [`interop-ns-swift-unavailable`](interop-ns-swift-unavailable.md) - Hide ObjC-only API from Swift with `NS_SWIFT_UNAVAILABLE`
- [`name-constant-namespaced`](name-constant-namespaced.md) - Namespace exported constants with the owning type's name
- [`null-boxed-expression-literals`](null-boxed-expression-literals.md) - Use boxed expressions (`@(x)`, `@[]`, `@{}`) instead of manual wrapper calls
