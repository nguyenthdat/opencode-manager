# lint-clang-format-consistent

> Enforce a single `.clang-format` style

## Why It Matters

Without an enforced, automated formatting standard, every contributor's editor settings (tab width, brace placement, line length) produce inconsistent diffs, making code reviews noisier (formatting changes obscuring actual logic changes) and turning trivial style disagreements into recurring review friction. A single `.clang-format` file, applied automatically, removes formatting as a discussion topic entirely.

## Bad

```yaml
# No .clang-format at all — every contributor's editor auto-formats
# differently, and every PR mixes real changes with incidental
# reformatting noise from whatever the previous editor's settings were.
```

## Good

```yaml
# .clang-format
BasedOnStyle: Google
ColumnLimit: 100
IndentWidth: 4
AccessModifierOffset: -2
AllowShortFunctionsOnASingleLine: Empty
PointerAlignment: Left
```

```bash
# Format the whole codebase once, then enforce going forward
clang-format -i $(find src include -name '*.cpp' -o -name '*.hpp')
```

## Enforcing in CI

```yaml
lint-format:
  script:
    - clang-format --dry-run --Werror $(find src include -name '*.cpp' -o -name '*.hpp')
```

## Editor Integration So Contributors Format Automatically

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "C_Cpp.clang_format_style": "file"
}
```

## Pre-Commit Hook as an Additional Safety Net

```bash
#!/bin/sh
# .git/hooks/pre-commit
clang-format --dry-run --Werror $(git diff --cached --name-only -- '*.cpp' '*.hpp')
```

## See Also

- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - Similar "enforce automatically, don't debate manually" principle
- [lint-warning-free-baseline](lint-warning-free-baseline.md) - Keeping formatting (and warnings) clean as a CI gate
- [proj-cmake-target-based](proj-cmake-target-based.md) - Build configuration these tools typically run alongside
