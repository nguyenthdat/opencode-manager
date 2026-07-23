# proj-cmake-target-based

> Use modern target-based CMake

## Why It Matters

Legacy CMake (`include_directories()`, `add_definitions()`, global `CMAKE_CXX_FLAGS`) applies settings to every target in the current directory and below, regardless of whether they actually need them, and doesn't propagate usage requirements correctly to dependents. Target-based CMake (`target_link_libraries`, `target_include_directories` with `PUBLIC`/`PRIVATE`/`INTERFACE`) scopes settings precisely to the targets that need them and automatically propagates public requirements to consumers.

## Bad — Legacy, Directory-Scoped CMake

```cmake
include_directories(include)              # Applies to EVERY target below, needed or not
add_definitions(-DUSE_FEATURE_X)           # Global flag, no per-target control
link_libraries(fmt)                         # Every target links fmt, whether it uses it or not

add_executable(app main.cpp)
add_library(mylib widget.cpp)
```

## Good — Target-Based CMake

```cmake
add_library(mylib widget.cpp)
target_include_directories(mylib PUBLIC include)   # Propagates to anything linking mylib
target_compile_definitions(mylib PRIVATE USE_FEATURE_X)  # Only affects mylib itself
target_link_libraries(mylib PUBLIC fmt::fmt)         # mylib's public headers use fmt,
                                                        # so consumers need it transitively

add_executable(app main.cpp)
target_link_libraries(app PRIVATE mylib)   # app automatically gets mylib's PUBLIC
                                              # include dirs and fmt dependency
```

## `PUBLIC` vs `PRIVATE` vs `INTERFACE`

| Keyword | Applies to this target | Propagates to consumers |
|---|---|---|
| `PRIVATE` | Yes | No |
| `INTERFACE` | No | Yes |
| `PUBLIC` | Yes | Yes |

```cmake
target_link_libraries(mylib
    PUBLIC  fmt::fmt           # Used in mylib's public headers: consumers need it too
    PRIVATE internal_helper    # Only used inside mylib.cpp: not exposed to consumers
)
```

## See Also

- [proj-separate-public-private-headers](proj-separate-public-private-headers.md) - Header layout that maps onto PUBLIC/PRIVATE
- [lint-compiler-warnings-as-errors](lint-compiler-warnings-as-errors.md) - Target-scoped warning flags via an INTERFACE library
- [mem-sanitizer-required](mem-sanitizer-required.md) - Sanitizer flags configured via target-based CMake options
