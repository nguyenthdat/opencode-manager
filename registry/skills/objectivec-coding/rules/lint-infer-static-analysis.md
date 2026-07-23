# lint-infer-static-analysis

> Run Meta's Infer static analyzer for deeper cross-procedure checks

## Why It Matters

Clang's built-in analyzer reasons mostly within a single translation unit and is tuned for the diagnostics Apple ships by default; Infer performs interprocedural analysis across the whole call graph and specializes in exactly the bug classes that matter most in large Objective-C codebases — nil-pointer dereferences that only manifest three call frames away, resource/memory leaks that cross function boundaries, and race conditions. Running both tools in CI catches a meaningfully different, largely non-overlapping set of bugs than either catches alone.

## Bad

```yaml
# CI runs only the Clang Static Analyzer and unit tests. A nil that's
# produced in OMWSessionManager and dereferenced two calls later inside
# OMWAPIClient -- a classic interprocedural bug -- passes both, because
# neither Clang's single-TU analysis nor the test suite happened to
# exercise that exact call path.
jobs:
  build-and-analyze:
    steps:
      - run: xcodebuild analyze -scheme OMWStore
      - run: xcodebuild test -scheme OMWStore
```

```objc
// OMWSessionManager.m
- (nullable OMWSession *)currentSession {
    return self.cachedSession;   // Can be nil after logout; nothing in
                                   // this file's local analysis flags
                                   // it because it's a legal, correct
                                   // return value for this method alone.
}
```

```objc
// OMWAPIClient.m -- three call frames away, dereferences without a
// nil check. Infer's interprocedural analysis traces this path;
// Clang's analyzer, scoped mostly to one function/TU, typically does not.
- (void)sendRequest {
    OMWSession *session = [self.sessionManager currentSession];
    NSString *token = session.authToken;   // Crashes if session is nil.
    [self.networkClient sendWithToken:token];
}
```

## Good

```yaml
# .github/workflows/infer.yml -- run Infer alongside, not instead of,
# the Clang Static Analyzer.
jobs:
  infer-analysis:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Install Infer
        run: brew install infer
      - name: Run Infer
        run: |
          infer run -- xcodebuild build \
            -scheme OMWStore \
            -destination "generic/platform=iOS"
      - name: Fail on new issues
        run: |
          if [ -s infer-out/report.txt ]; then
            cat infer-out/report.txt
            exit 1
          fi
```

```objc
// Fixed once Infer's NULL_DEREFERENCE finding is triaged: the nil
// check moves to the boundary where the value can legitimately be nil.
- (void)sendRequest {
    OMWSession *_Nullable session = [self.sessionManager currentSession];
    if (session == nil) {
        [self handleMissingSession];
        return;
    }
    [self.networkClient sendWithToken:session.authToken];
}
```

## Baselining Existing Issues

```bash
# On an existing codebase, capture the current issue set as a baseline
# so CI fails only on *new* Infer findings, not the entire legacy backlog.
infer run -- xcodebuild build -scheme OMWStore
cp infer-out/report.json infer-baseline.json
# CI then diffs infer-out/report.json against infer-baseline.json.
```

## See Also

- [`lint-clang-static-analyzer-ci`](lint-clang-static-analyzer-ci.md) - Run the Clang Static Analyzer in CI
- [`anti-unvalidated-nonnull-violation`](anti-unvalidated-nonnull-violation.md) - Don't pass `nil` across a `nonnull` boundary and hope for the best
- [`lint-nullability-completeness-check`](lint-nullability-completeness-check.md) - Enable `-Wnullable-to-nonnull-conversion` and related nullability warnings
