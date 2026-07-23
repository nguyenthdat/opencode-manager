# lint-undefined-behavior-sanitizer

> Build and test with UndefinedBehaviorSanitizer

## Why It Matters

UndefinedBehaviorSanitizer (UBSan) detects a wide range of undefined behavior that neither the compiler nor ASan catches by default: signed integer overflow, null pointer dereference, misaligned pointer access, invalid enum values, and invalid `static_cast`/`reinterpret_cast` usage — all of which can produce "correct-looking" output right up until a compiler optimization exploits the UB and changes behavior unexpectedly.

## Bad

```cpp
int compute_checksum(const std::vector<int>& values) {
    int sum = 0;
    for (int v : values) {
        sum += v;   // Signed overflow is UB — the compiler may assume it never
    }                // happens and optimize based on that assumption, producing
    return sum;       // surprising results for large inputs, with no runtime warning.
}
```

## Good

```cmake
option(ENABLE_UBSAN "Build with UndefinedBehaviorSanitizer" OFF)
if(ENABLE_UBSAN)
  add_compile_options(-fsanitize=undefined -fno-sanitize-recover=all -g)
  add_link_options(-fsanitize=undefined)
endif()
```

```bash
cmake -B build-ubsan -DENABLE_UBSAN=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build-ubsan
ctest --test-dir build-ubsan
```

## Example Output

```
widget.cpp:15:13: runtime error: signed integer overflow:
2147483647 + 1 cannot be represented in type 'int'
```

## Combine With ASan in One Build (They're Compatible)

```cmake
if(ENABLE_SANITIZERS)
  add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer -g)
  add_link_options(-fsanitize=address,undefined)
endif()
```

## `-fno-sanitize-recover=all` Makes Violations Fatal

```bash
# Without this flag, UBSan by default reports and continues execution,
# potentially masking cascading failures from the same root cause. Use
# -fno-sanitize-recover=all in CI so the first violation stops the test.
```

## See Also

- [mem-sanitizer-required](mem-sanitizer-required.md) - The broader sanitizer strategy
- [lint-address-sanitizer](lint-address-sanitizer.md) - Commonly combined with UBSan in the same build
- [type-narrowing-conversion-explicit](type-narrowing-conversion-explicit.md) - Related overflow/conversion hazards
