# lint-cyclomatic-complexity

> Enable complexity/type-body-length rules to catch God objects

## Why It Matters

A function or type doesn't become a "God object" overnight — it grows one `if` branch, one more responsibility, one more property at a time, and each individual PR looks like a reasonable small addition. Without an automated ceiling, nothing forces a "let's split this up" conversation until the type is already a 2,000-line view controller that nobody wants to touch. `cyclomatic_complexity` and `type_body_length`/`function_body_length` rules put a hard, visible line in the sand that triggers the refactoring conversation at PR #12 of the slow creep, not at PR #200 when it's a much bigger job.

## Bad

```yaml
# .swiftlint.yml — no complexity or length ceilings configured
disabled_rules:
  - cyclomatic_complexity
  - type_body_length
  - function_body_length
```
```swift
// Grows unchecked over 18 months into an 1,800-line "OrderViewController"
// handling networking, validation, analytics, navigation, and view layout
// all in one type — no lint signal ever fired to prompt a split.
```

## Good

```yaml
# .swiftlint.yml
cyclomatic_complexity:
  warning: 12
  error: 20

type_body_length:
  warning: 250
  error: 400

function_body_length:
  warning: 50
  error: 100

file_length:
  warning: 400
  error: 600
```
```
$ swiftlint lint
warning: Function Body Length Violation: Function body should span 50 lines or less
  excluding comments and whitespace: currently spans 87 lines (function_body_length)
  --> Sources/AppFeature/OrderViewController.swift:42
```
This surfaces the "this is getting too big" signal automatically, as soon as the threshold is crossed, rather than relying on a reviewer noticing.

## Tuning Thresholds Per Codebase

Default thresholds are a starting point, not gospel — a codebase with genuinely complex domain logic (a tax calculation engine, a state machine with many legitimate branches) may need a higher ceiling than UI code. Set the threshold where it reliably flags accidental complexity without constantly firing on necessary complexity, and revisit it if it's either never triggering or triggering on every PR:

```yaml
cyclomatic_complexity:
  warning: 10    # UI/business-logic code: keep tight
  error: 15

  ignores_case_statements: true   # a 15-case exhaustive switch isn't "complex," it's exhaustive
```

## See Also

- [`anti-massive-view-controller`](anti-massive-view-controller.md) - the anti-pattern this rule is designed to catch early
- [`anti-god-protocol`](anti-god-protocol.md) - the protocol-design analog of an overgrown type
- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - the baseline config these thresholds live in
