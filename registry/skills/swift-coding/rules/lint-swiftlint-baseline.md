# lint-swiftlint-baseline

> Adopt a SwiftLint baseline ruleset in CI

## Why It Matters

Without a shared, enforced lint config, style and safety conventions live only in code review comments and tribal knowledge — inconsistently applied, easy to forget under deadline pressure, and invisible to new contributors until someone points it out after the fact. A SwiftLint baseline checked into the repo and enforced in CI turns "please don't force-unwrap here" from a recurring review comment into a build failure that catches the issue before a human reviewer even needs to look, freeing review time for actual logic and design.

## Bad

```
# No .swiftlint.yml in the repo at all.
# Style/safety enforcement exists only as scattered PR comments:
#   "nit: avoid force unwrap here"
#   "can you break this function up, it's pretty long"
#   "we usually use `guard` for this pattern"
```

## Good

```yaml
# .swiftlint.yml
opt_in_rules:
  - force_unwrapping
  - force_try
  - implicitly_unwrapped_optional
  - empty_count
  - closure_spacing
  - unused_import
  - fatal_error_message

disabled_rules:
  - todo   # tracked separately in the issue tracker, not blocking

line_length:
  warning: 120
  error: 160

type_body_length:
  warning: 250
  error: 400

function_body_length:
  warning: 50
  error: 100

excluded:
  - .build
  - Sources/Generated
  - Tests/Fixtures
```

```yaml
# .github/workflows/lint.yml
name: Lint
on: [pull_request]
jobs:
  swiftlint:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Run SwiftLint
        run: swiftlint lint --strict --reporter github-actions-logging
```

`--strict` promotes warnings to failures in CI (while local `swiftlint lint` can stay warning-only for a faster inner loop), so the baseline is actually enforced, not just advisory.

## Adopting a Baseline on a Legacy Codebase

Rolling a strict baseline onto an existing large codebase all at once usually produces thousands of violations and gets the whole effort abandoned. Instead, generate a baseline snapshot of current violations, commit it, and configure SwiftLint to fail only on *new* violations while the backlog is fixed incrementally:

```bash
swiftlint lint --reporter json > .swiftlint-baseline.json
```

```yaml
# .swiftlint.yml
baseline: .swiftlint-baseline.json
```

## See Also

- [`lint-force-unwrap-rule`](lint-force-unwrap-rule.md) - specific rules to opt into within this baseline
- [`lint-cyclomatic-complexity`](lint-cyclomatic-complexity.md) - complexity rules layered on top of the baseline
- [`lint-custom-rules-project`](lint-custom-rules-project.md) - extending the baseline with project-specific rules
- [`lint-warnings-as-errors`](lint-warnings-as-errors.md) - the compiler-level counterpart to a strict lint baseline
