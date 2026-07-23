# lint-cppcheck-static-analysis

> Run cppcheck as a second opinion

## Why It Matters

Different static analyzers use different analysis techniques and catch different bug classes — cppcheck's dataflow analysis and its "unusedFunction"/resource-leak/uninitialized-variable checks complement, rather than duplicate, clang-tidy's check set. Running both provides broader coverage than relying on a single tool, at relatively low additional cost.

## Bad

```yaml
# Only clang-tidy is run — issues specifically within cppcheck's detection
# strengths (certain resource-leak patterns, unused private members,
# specific STL misuse patterns) may go uncaught.
```

## Good

```bash
cppcheck --enable=all --inconclusive --std=c++20 \
    --suppress=missingIncludeSystem \
    -I include/ src/
```

```yaml
# CI job
lint-cppcheck:
  script:
    - cppcheck --enable=warning,style,performance,portability --error-exitcode=1
        --std=c++20 -I include/ src/
```

## Example Findings

```
[src/widget.cpp:42]: (error) Uninitialized variable: width
[src/widget.cpp:58]: (warning) Member variable 'Widget::height_' is not initialized in the constructor.
[src/parser.cpp:103]: (performance) Function parameter 'data' should be passed by reference.
```

## Suppressing False Positives Explicitly

```cpp
// cppcheck-suppress uninitvar
int x;   // Deliberately left uninitialized; documented reason inline
fill_via_output_parameter(&x);
```

## Combine, Don't Replace, clang-tidy

```yaml
# Both tools run in CI as independent, complementary checks — a finding
# from either one is treated as worth investigating, not dismissed because
# the other tool didn't also flag it.
lint:
  script:
    - run-clang-tidy -p build
    - cppcheck --enable=all --error-exitcode=1 --std=c++20 -I include/ src/
```

## See Also

- [lint-clang-tidy-baseline](lint-clang-tidy-baseline.md) - The complementary primary static analyzer
- [lint-warning-free-baseline](lint-warning-free-baseline.md) - Keeping both tools' output clean over time
- [mem-null-check-before-deref](mem-null-check-before-deref.md) - A bug class both tools help catch
