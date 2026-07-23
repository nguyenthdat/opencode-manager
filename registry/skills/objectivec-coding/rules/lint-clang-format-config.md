# lint-clang-format-config

> Enforce a shared `.clang-format` style in CI

## Why It Matters

Without a shared, enforced style file, every contributor's editor reformats differently — brace placement, pointer alignment (`NSString* x` vs `NSString *x`), and continuation indentation drift file by file — and pull requests fill up with whitespace-only diffs that bury the actual logic change under noise, making review slower and `git blame` useless. A checked-in `.clang-format` plus a CI check that runs it in `--dry-run` mode removes style bikeshedding from every code review entirely.

## Bad

```objc
// No shared .clang-format. Two engineers on the same file produce
// incompatible styles depending on their personal Xcode preferences:

// Engineer A's style:
- (void)fetchUserWithID:(NSString*)userID completion:(void(^)(OMWUser*, NSError*))completion
{
    if(!userID){ completion(nil, nil); return; }
    // ...
}

// Engineer B's style, same file, six months later:
- (void)fetchUserWithID:(NSString *)userID
              completion:(void (^)(OMWUser *, NSError *))completion {
  if (!userID) {
    completion(nil, nil);
    return;
  }
  // ...
}
// The next PR that touches this method reformats the whole thing,
// and the actual behavioral diff is buried in whitespace noise.
```

## Good

```yaml
# .clang-format -- checked into the repo root, applies to every .h/.m/.mm.
Language: ObjC
BasedOnStyle: Google
ColumnLimit: 100
ObjCBlockIndentWidth: 2
ObjCSpaceAfterProperty: true
ObjCSpaceBeforeProtocolList: true
PointerAlignment: Right
IndentWidth: 2
AllowShortBlocksOnASingleLine: false
AllowShortFunctionsOnASingleLine: Empty
BreakBeforeBraces: Attach
SortIncludes: false
```

```yaml
# .github/workflows/format-check.yml
jobs:
  clang-format-check:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Verify formatting
        run: |
          find . -name "*.h" -o -name "*.m" -o -name "*.mm" | \
            xargs clang-format --dry-run --Werror
```

## Local Pre-Commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit -- format staged Objective-C files automatically
# before they're committed, so CI never even sees a formatting mismatch.
git diff --cached --name-only --diff-filter=ACM | \
  grep -E '\.(h|m|mm)$' | \
  xargs -I{} clang-format -i {}
git diff --cached --name-only --diff-filter=ACM | \
  grep -E '\.(h|m|mm)$' | \
  xargs git add
```

## See Also

- [`lint-warnings-as-errors-build-setting`](lint-warnings-as-errors-build-setting.md) - Treat warnings as errors (`GCC_TREAT_WARNINGS_AS_ERRORS`) in CI builds
- [`lint-oclint-ruleset`](lint-oclint-ruleset.md) - Adopt an OCLint ruleset for structural/complexity issues
- [`doc-pragma-mark-organize`](doc-pragma-mark-organize.md) - Use `#pragma mark -` to organize file sections
