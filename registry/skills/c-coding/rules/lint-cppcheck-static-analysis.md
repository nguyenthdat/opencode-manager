# lint-cppcheck-static-analysis

> Run `cppcheck` in CI as a fast, low-false-positive complement to clang-tidy and compiler warnings

## Why It Matters

`cppcheck` is designed specifically to minimize false positives, focusing on high-confidence findings — genuine null-pointer dereferences, memory leaks, out-of-bounds access, and use of uninitialized variables that its data-flow analysis can prove with reasonable certainty. Its different analysis engine and design philosophy from clang-tidy/GCC means it frequently catches a distinct, non-overlapping set of real bugs.

## Bad

```sh
# Relying solely on compiler warnings and clang-tidy; cppcheck's specific
# analysis strengths (particularly around leak/null-deref detection) are
# never brought to bear on the codebase at all.
```

## Good

```sh
cppcheck --enable=warning,style,performance,portability \
          --error-exitcode=1 \
          --suppress=missingIncludeSystem \
          -Iinclude src/
```

## CI Integration

```yaml
- name: Run cppcheck
  run: |
    cppcheck --enable=warning,style,performance,portability \
             --error-exitcode=1 \
             -Iinclude src/
```

## Key Checks cppcheck Is Particularly Good At

| Check area | Example finding |
|------------|------------------|
| Null pointer | Dereferencing a pointer on a path where it could be `NULL` |
| Memory leaks | An allocated pointer that isn't freed on some code path |
| Uninitialized variables | A read reachable before any write |
| Buffer overrun | Array access provably out of bounds given known array size |

## Suppressing a Specific False Positive

```c
// cppcheck-suppress nullPointer
value = maybe_null->field;   /* justified: checked via an external invariant cppcheck can't see */
```

## See Also

- [lint-clang-tidy-checks](lint-clang-tidy-checks.md) - The complementary clang-based analyzer
- [lint-static-analysis-in-ci](lint-static-analysis-in-ci.md) - Combining multiple analyzers in one CI pipeline
- [mem-valgrind-asan-verify](mem-valgrind-asan-verify.md) - Dynamic analysis that complements this static analysis
