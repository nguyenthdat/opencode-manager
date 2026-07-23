# lint-unused-import

> Enable unused import/declaration detection

## Why It Matters

Unused imports accumulate silently as code is refactored — a file that used to need `Combine` no longer does after migrating to `async`/`await`, but the `import Combine` line stays behind, adding an unnecessary module dependency to every build of that file and misleading readers about what the file actually uses. Unused declarations (a `private` function nobody calls anymore, a property left over from a removed feature) are worse: dead code that still gets maintained, still shows up in searches, and still has to be reasoned about by anyone reading the file, for zero benefit.

## Bad

```swift
import Combine       // no longer used after migrating to async/await
import CoreLocation   // copy-pasted from a template, never referenced
import SwiftUI

struct ProfileView: View {
    var body: some View { Text("Profile") }

    // Dead code left behind after a refactor — nobody calls this anymore.
    private func legacyFormat(_ date: Date) -> String {
        DateFormatter().string(from: date)
    }
}
```

## Good

```yaml
# .swiftlint.yml
analyzer_rules:
  - unused_declaration
  - unused_import
```
```
$ swiftlint analyze --compiler-log-path build.log
warning: Unused Import Violation: Imports should be sorted and should not be
  duplicated (unused_import)
  --> Sources/AppFeature/ProfileView.swift:1

warning: Unused Declaration Violation: Declaration 'legacyFormat(_:)' is unused
  (unused_declaration)
  --> Sources/AppFeature/ProfileView.swift:9
```
```swift
import SwiftUI   // only what's actually used

struct ProfileView: View {
    var body: some View { Text("Profile") }
}
```

## Running the Analyzer Rules

`unused_declaration`/`unused_import` are *analyzer* rules — they require a full compiler build log, not just a syntax pass, so they run via `swiftlint analyze`, separately from the regular `swiftlint lint` pass:

```bash
# Generate a compiler log first (xcpretty or xcodebuild -showBuildTimingSummary work too)
swift build 2>&1 | tee build.log
swiftlint analyze --compiler-log-path build.log
```

```yaml
# .github/workflows/analyze.yml
- name: Build with log
  run: swift build 2>&1 | tee build.log
- name: Run SwiftLint analyzer rules
  run: swiftlint analyze --compiler-log-path build.log --strict
```

Analyzer rules are slower than the standard lint pass (they need a real build), so run them as a separate, possibly less-frequent CI job rather than blocking every push.

## See Also

- [`lint-analyze-build`](lint-analyze-build.md) - the broader static-analysis CI pass this rule is part of
- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - the standard (non-analyzer) rule baseline
- [`interop-bridging-header-minimal`](interop-bridging-header-minimal.md) - the same "only import what's needed" principle applied to bridging headers
