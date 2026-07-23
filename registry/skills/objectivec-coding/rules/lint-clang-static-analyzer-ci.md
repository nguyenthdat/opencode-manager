# lint-clang-static-analyzer-ci

> Run the Clang Static Analyzer in CI

## Why It Matters

The Clang Static Analyzer finds whole classes of bugs (retain-count violations, null-pointer dereferences, dead stores, leaked Core Foundation objects) through symbolic execution that ordinary compiler warnings never catch, because it explores multiple code paths rather than just checking syntax. Running it only ad hoc on a developer's machine means most commits ship without ever being analyzed, and by the time someone does run it locally, the backlog of accumulated warnings is too large to act on.

## Bad

```yaml
# .github/workflows/ci.yml -- builds and tests, but never runs the analyzer.
jobs:
  build-and-test:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: xcodebuild build -scheme OMWStore -destination "generic/platform=iOS"
      - name: Test
        run: xcodebuild test -scheme OMWStore -destination "platform=iOS Simulator,name=iPhone 15"
      # No analyze step -- a leaked CFDictionaryRef or a use of a
      # newly-nil pointer down one code path ships straight to review.
```

## Good

```yaml
# .github/workflows/ci.yml
jobs:
  static-analysis:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Run Clang Static Analyzer
        run: |
          xcodebuild analyze \
            -scheme OMWStore \
            -destination "generic/platform=iOS" \
            RUN_CLANG_STATIC_ANALYZER=YES \
            CLANG_ANALYZER_NONNULL=YES \
            | tee analyze.log
          # Fail the build if the analyzer emitted any diagnostics.
          if grep -q "warning:" analyze.log; then
            echo "Static analyzer found issues"; exit 1
          fi
```

```
// Shared.xcconfig -- keep the analyzer's aggressive checks on for
// every local and CI build, not just a special CI-only pass.
RUN_CLANG_STATIC_ANALYZER = YES
CLANG_ANALYZER_NONNULL = YES
CLANG_ANALYZER_NUMBER_OBJECT_CONVERSION = YES_AGGRESSIVE
CLANG_ANALYZER_SECURITY_FLOATLOOPCOUNTER = YES
CLANG_ANALYZER_SECURITY_INSECUREAPI_UNSAFECSTRING = YES
```

## Triaging a Real Analyzer Finding

```objc
// Example of a genuine analyzer catch: a Core Foundation object
// created with a +1 retain count that is never released on the
// error path.
- (nullable CGImageRef)createImageFromData:(NSData *)data CF_RETURNS_RETAINED {
    CGDataProviderRef provider = CGDataProviderCreateWithCFData((__bridge CFDataRef)data);
    if (provider == NULL) {
        return NULL;
    }
    CGImageRef image = CGImageCreateWithPNGDataProvider(provider, NULL, true, kCGRenderingIntentDefault);
    CGDataProviderRelease(provider);   // Analyzer flags this as missing
                                        // before the early return above
                                        // in an earlier revision -- fixed
                                        // by releasing on every path.
    return image;
}
```

## See Also

- [`lint-infer-static-analysis`](lint-infer-static-analysis.md) - Run Meta's Infer static analyzer for deeper cross-procedure checks
- [`lint-warnings-as-errors-build-setting`](lint-warnings-as-errors-build-setting.md) - Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds
- [`arc-bridge-corefoundation`](arc-bridge-corefoundation.md) - Use `__bridge`/`CFBridgingRetain`/`CFBridgingRelease` correctly at CF/ObjC boundaries
