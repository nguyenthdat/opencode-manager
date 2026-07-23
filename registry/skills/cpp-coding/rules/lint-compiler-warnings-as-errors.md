# lint-compiler-warnings-as-errors

> Compile with `-Wall -Wextra -Wpedantic -Werror`

## Why It Matters

Compiler warnings flag real, common bug patterns (unused variables, sign comparison mismatches, implicit fallthrough) directly during the build the developer is already running — the fastest possible feedback loop, with zero extra tooling. Treating them as errors (`-Werror`) forces they be fixed rather than silently accumulating and eventually being ignored entirely.

## Bad

```cmake
# No warning flags configured at all — the compiler's built-in bug-detection
# capability goes almost entirely unused.
add_executable(myapp main.cpp)
```

## Good

```cmake
add_library(project_warnings INTERFACE)
target_compile_options(project_warnings INTERFACE
  $<$<CXX_COMPILER_ID:GNU,Clang>:
    -Wall -Wextra -Wpedantic -Wshadow -Wconversion -Wsign-conversion
    -Wnon-virtual-dtor -Wold-style-cast -Woverloaded-virtual
    -Wnull-dereference -Wdouble-promotion -Werror
  >
  $<$<CXX_COMPILER_ID:MSVC>:/W4 /permissive- /WX>
)

target_link_libraries(myapp PRIVATE project_warnings)
```

## Introducing Into an Existing Codebase Incrementally

```cmake
# If -Werror on everything at once is too disruptive, enable warnings
# without -Werror first, fix the backlog, then flip -Werror on:
target_compile_options(project_warnings INTERFACE -Wall -Wextra -Wpedantic)
# Once clean: add -Werror
```

## Selectively Suppressing a Justified Exception

```cpp
#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wunused-parameter"
#endif
void legacy_callback(int unused_but_required_by_api) { /* ... */ }
#if defined(__GNUC__) || defined(__clang__)
#pragma GCC diagnostic pop
#endif
```

## See Also

- [lint-clang-tidy-baseline](lint-clang-tidy-baseline.md) - Static analysis beyond what compiler warnings catch
- [lint-warning-free-baseline](lint-warning-free-baseline.md) - Maintaining a zero-warning baseline over time
- [type-narrowing-conversion-explicit](type-narrowing-conversion-explicit.md) - The specific issue `-Wconversion` flags
