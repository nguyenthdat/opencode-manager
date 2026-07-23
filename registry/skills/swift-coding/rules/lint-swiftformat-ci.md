# lint-swiftformat-ci

> Run SwiftFormat/`swift format` in CI to enforce style

## Why It Matters

Manual formatting nits ("put the brace on the next line," "align these parameters") waste review time on things a tool should decide once and enforce automatically, and inconsistent formatting across a codebase makes diffs noisier than they need to be — a two-line logic change surrounded by whitespace reflow hides the actual change. Running SwiftFormat (or the official `swift format`) in CI, with `--lint` mode failing the build on any unformatted file, makes formatting a non-negotiable, zero-discussion gate instead of an ongoing point of contention in every PR.

## Bad

```
# No formatter configured. Every PR has some mix of:
#   - 4-space vs 2-space indentation depending on who wrote it
#   - trailing commas in some multi-line literals, not others
#   - inconsistent brace placement
# Review comments repeatedly nitpick formatting instead of logic.
```

## Good

```
# .swiftformat
--indent 4
--maxwidth 120
--wraparguments before-first
--closingparen same-line
--trailingcommas always
--self remove
--importgrouping testable-bottom
```

```yaml
# .github/workflows/format.yml
name: Format Check
on: [pull_request]
jobs:
  swiftformat:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - name: Check formatting
        run: swiftformat --lint .
```

`swiftformat --lint .` exits non-zero if any file would be reformatted, without modifying files — exactly what a CI gate needs. Developers run `swiftformat .` locally (or wire it into a pre-commit hook) to actually apply the fixes before pushing.

## Using the Official `swift format` Instead

Swift's official toolchain now ships `swift format` (from `swift-format`), configured via `.swift-format` JSON, as an alternative to the third-party SwiftFormat tool — pick one per project, not both, to avoid conflicting rewrites:

```json
{
  "version": 1,
  "lineLength": 120,
  "indentation": { "spaces": 4 },
  "respectsExistingLineBreaks": true
}
```

```yaml
- name: Check formatting
  run: swift format lint --recursive --strict Sources Tests
```

## See Also

- [`lint-swiftlint-baseline`](lint-swiftlint-baseline.md) - style/safety linting layered alongside formatting
- [`lint-warnings-as-errors`](lint-warnings-as-errors.md) - the compiler-warning counterpart to a formatting gate
- [`proj-package-swift-tools-version`](proj-package-swift-tools-version.md) - `swift format`/`swift-format` version pinning tracks the toolchain version
