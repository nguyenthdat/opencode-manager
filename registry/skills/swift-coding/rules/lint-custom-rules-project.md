# lint-custom-rules-project

> Define custom SwiftLint rules for project-specific conventions

## Why It Matters

Stock SwiftLint rules cover general Swift idioms, but every nontrivial project accumulates its own conventions that are just as important and just as easy to violate — "always go through `APIClient.shared.request`, never call `URLSession` directly," "use our `AppLogger`, not `print`," "don't construct `Date()` directly in business logic, inject a `Clock`." Without a way to encode those as lint rules, they live only as review comments and onboarding-doc trivia that new contributors miss until a reviewer catches it — usually after the code has already shipped.

## Bad

```
# CONTRIBUTING.md, buried in a list of 40 other conventions:
# "Please don't call print() directly, use AppLogger.log() instead."
#
# — unenforced; grep shows 60+ stray print() calls across the codebase
# because SwiftLint has no rule for it and reviewers don't catch every instance.
```

## Good

```yaml
# .swiftlint.yml
custom_rules:
  no_direct_print:
    name: "No direct print()"
    regex: '(?<!// )\bprint\('
    message: "Use AppLogger.log(...) instead of print() so logs are filterable and redacted in release builds."
    severity: error

  no_direct_urlsession:
    name: "No direct URLSession usage"
    regex: '\bURLSession\.(shared|init)\b'
    message: "Route requests through APIClient so auth headers/retry policy stay centralized."
    severity: error
    excluded: "Sources/Networking/APIClient.swift"

  no_direct_date_init:
    name: "No direct Date() in business logic"
    regex: '\bDate\(\)'
    message: "Inject a Clock/DateProvider instead of calling Date() directly, for testability."
    severity: warning
    included: "Sources/Domain/.*\\.swift"
```
```
$ swiftlint lint
error: No direct print() Violation: Use AppLogger.log(...) instead of print()
  so logs are filterable and redacted in release builds. (no_direct_print)
  --> Sources/AppFeature/Checkout.swift:88
```

## Keeping Custom Rules Maintainable

Regex-based custom rules are powerful but blunt — they can't understand syntax, only text patterns, so keep them scoped narrowly (`included`/`excluded` paths) to avoid false positives on legitimate exceptions (a comment mentioning `print(`, the one file that's allowed to call `URLSession` directly). Document the *reason* for each rule in its `message` so a flagged violation is self-explanatory without needing to look up a wiki page.

## See Also

- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - the baseline config custom rules extend
- [`anti-singleton-overuse`](anti-singleton-overuse.md) - a common target for a "route through the injected dependency" custom rule
- [`err-never-swallow`](err-never-swallow.md) - another convention often worth enforcing as a custom rule (`catch {}` detection)
