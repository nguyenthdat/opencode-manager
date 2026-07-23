# lint-force-unwrap-rule

> Enable SwiftLint `force_unwrapping`/`force_try` rules

## Why It Matters

Force unwrap (`!`) and force try (`try!`) are the single most common source of avoidable production crashes in Swift codebases — each one is a claim that a value can never be `nil` or an operation can never fail, and that claim is rarely re-verified as the surrounding code changes. Code review catches some of these, but reviewers get fatigued and miss instances in large diffs; a SwiftLint rule flags every `!`/`try!` deterministically, every time, regardless of reviewer attention, and lets you track the count over time as a real crash-risk metric.

## Bad

```yaml
# .swiftlint.yml — force unwrap/try not opted into, no signal at all
opt_in_rules:
  - empty_count
```
```swift
// Passes lint silently; ships to production
func loadUser() -> User {
    let data = try! Data(contentsOf: userFileURL)   // crashes if the file is missing/corrupt
    let user = try! JSONDecoder().decode(User.self, from: data)
    return user
}
```

## Good

```yaml
# .swiftlint.yml
opt_in_rules:
  - force_unwrapping
  - force_try

force_unwrapping:
  severity: error

force_try:
  severity: error
```
```swift
// Now flagged at lint time, forcing a real decision:
func loadUser() throws -> User {
    let data = try Data(contentsOf: userFileURL)
    return try JSONDecoder().decode(User.self, from: data)
}
```

## Scoping Exceptions Instead of Disabling Globally

Tests and `#Preview` bodies legitimately use force unwrap for fixture setup where a crash on bad test data is the correct, fast-failing behavior. Exclude those paths from the rule rather than disabling it project-wide:

```yaml
force_unwrapping:
  severity: error
  excluded:
    - "**/*Tests.swift"
    - "**/PreviewContent/**"
```

For a rare, deliberately justified production force unwrap (a genuinely proven invariant, e.g. a regex literal compiled from a constant string known at compile time), suppress it locally with an inline comment rather than weakening the rule everywhere:

```swift
// swiftlint:disable:next force_unwrapping
let regex = try! NSRegularExpression(pattern: "^[A-Z]{3}-\\d+$")  // pattern is a compile-time constant
```

## See Also

- [`type-no-force-unwrap`](type-no-force-unwrap.md) - the underlying rule this lint enforces
- [`err-no-force-try`](err-no-force-try.md) - the `try!` counterpart
- [`anti-force-unwrap-abuse`](anti-force-unwrap-abuse.md) - anti-pattern reference with more context
- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - the baseline config this rule is opted into
