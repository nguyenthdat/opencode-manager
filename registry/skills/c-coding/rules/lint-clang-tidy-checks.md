# lint-clang-tidy-checks

> Run `clang-tidy` with a curated check set in CI to catch bug patterns and style issues beyond what compiler warnings cover

## Why It Matters

`clang-tidy` performs deeper static analysis than compiler warnings alone — it can flag likely bugs (suspicious `memcpy` sizes, potential null dereferences, resource leaks), enforce naming/style conventions, and suggest modernization changes. It complements, rather than replaces, compiler warnings and sanitizers, catching a different class of issue (patterns, not just individual expressions).

## Bad

```sh
# No static analysis beyond default compiler warnings; clang-tidy's bug-pattern
# and readability checks are never run at all.
cc -Wall -Wextra -o app main.c
```

## Good

```yaml
# .clang-tidy (project root)
Checks: >
  bugprone-*,
  clang-analyzer-*,
  cert-*,
  performance-*,
  readability-*,
  -readability-magic-numbers
WarningsAsErrors: 'bugprone-*,clang-analyzer-*'
```

```sh
clang-tidy src/*.c -- -std=c17 -Iinclude
```

## Useful Check Categories for C

| Category | Example checks |
|----------|-----------------|
| `bugprone-*` | Suspicious sizeof usage, string comparison mistakes |
| `clang-analyzer-*` | Path-sensitive analysis: null derefs, leaks, dead stores |
| `cert-*` | Rules aligned with the CERT C Coding Standard |
| `performance-*` | Unnecessary copies, inefficient patterns |

## CI Integration

```yaml
- name: Run clang-tidy
  run: clang-tidy $(find src -name '*.c') -- -std=c17 -Iinclude
```

## See Also

- [lint-cppcheck-static-analysis](lint-cppcheck-static-analysis.md) - A complementary static analyzer with different strengths
- [lint-static-analysis-in-ci](lint-static-analysis-in-ci.md) - Broader CI integration guidance for these tools
- [lint-scan-build-clang-analyzer](lint-scan-build-clang-analyzer.md) - Clang's path-sensitive analyzer, run differently
