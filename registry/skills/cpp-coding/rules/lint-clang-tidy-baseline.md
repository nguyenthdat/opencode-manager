# lint-clang-tidy-baseline

> Run clang-tidy with a curated check baseline

## Why It Matters

clang-tidy catches a broad range of issues beyond what compiler warnings cover: modernization opportunities (`modernize-*`), Core Guidelines violations (`cppcoreguidelines-*`), and common bug patterns (`bugprone-*`). Running it with a deliberately curated, project-appropriate check set — not either the bare defaults or every check blindly enabled — catches real issues without drowning the team in noise from checks that don't fit the codebase's style.

## Bad

```yaml
# No .clang-tidy at all — issues that clang-tidy would catch (use-after-move,
# modernization opportunities, Core Guidelines violations) go completely unchecked.
```

```yaml
# Or the opposite failure mode: every single check enabled indiscriminately,
# producing thousands of low-value warnings that make genuine issues
# impossible to find in the noise, and get the tool disabled out of frustration.
Checks: '*'
```

## Good

```yaml
# .clang-tidy
Checks: >
  -*,
  bugprone-*,
  clang-analyzer-*,
  cppcoreguidelines-*,
  -cppcoreguidelines-avoid-magic-numbers,
  modernize-*,
  -modernize-use-trailing-return-type,
  performance-*,
  portability-*,
  readability-*,
  -readability-magic-numbers,
  -readability-identifier-length

WarningsAsErrors: 'bugprone-*,clang-analyzer-*,cppcoreguidelines-slicing'
HeaderFilterRegex: '^(include|src)/'
```

## Running in CI

```bash
run-clang-tidy -p build -j$(nproc) src/ include/
# Or per-file, integrated with a build wrapper:
clang-tidy --config-file=.clang-tidy -p build src/widget.cpp
```

## Introducing Into an Existing Large Codebase

```bash
# Baseline existing warnings first, so only NEW violations block CI —
# gradually fix the baseline over time rather than requiring a big-bang fix:
run-clang-tidy -p build > baseline_warnings.txt
```

## See Also

- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - Complementary compiler-level warnings
- [lint-cppcheck-static-analysis](lint-cppcheck-static-analysis.md) - A second, independent static analyzer
- [mem-use-after-move](mem-use-after-move.md) - One specific bug class clang-tidy's `bugprone-*` catches
