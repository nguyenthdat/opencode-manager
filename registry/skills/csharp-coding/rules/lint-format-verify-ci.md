# lint-format-verify-ci

> Run `dotnet format --verify-no-changes` in CI to enforce formatting without letting it silently drift

## Why It Matters

Local IDE auto-formatting is only as consistent as every developer's editor configuration - without a CI check, formatting drift creeps in from anyone whose editor isn't configured to match `.editorconfig`. `dotnet format --verify-no-changes` fails the build if any file isn't already correctly formatted, catching drift before it merges.

## Bad

```yaml
# CI pipeline with no formatting check at all - inconsistent formatting
# merges freely as long as the code compiles and tests pass.
steps:
  - run: dotnet build
  - run: dotnet test
```

## Good

```yaml
# CI pipeline
steps:
  - run: dotnet format --verify-no-changes --severity warn
  - run: dotnet build --configuration Release
  - run: dotnet test --configuration Release
```

## Running It Locally Before Committing

```bash
# Fix formatting locally before pushing, rather than discovering it failed in CI
dotnet format

# Just check without modifying files (same as the CI invocation)
dotnet format --verify-no-changes
```

## Scoping to Specific Fix Categories

```bash
dotnet format style       # .editorconfig style rules only
dotnet format analyzers   # Roslyn analyzer-based fixes only
dotnet format whitespace  # whitespace/indentation only
```

## Pre-Commit Hook for Immediate Local Feedback

```bash
#!/bin/sh
# .git/hooks/pre-commit
dotnet format --verify-no-changes || {
    echo "Formatting issues found. Run 'dotnet format' and re-commit."
    exit 1
}
```

## See Also

- [lint-editorconfig-enforce](lint-editorconfig-enforce.md) - The rules dotnet format enforces
- [lint-treat-warnings-as-errors](lint-treat-warnings-as-errors.md) - The build-breaking counterpart for compiler warnings
