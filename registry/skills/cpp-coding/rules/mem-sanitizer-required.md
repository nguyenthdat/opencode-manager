# mem-sanitizer-required

> Run ASan/UBSan in test builds, not just release

## Why It Matters

Memory-safety bugs (buffer overruns, use-after-free, double-free) and undefined-behavior bugs (signed overflow, misaligned access, invalid casts) frequently produce no visible symptom in a normal debug or release build — they corrupt memory silently and manifest as an unrelated crash much later, or not at all until conditions change. Sanitizers instrument the binary to catch these at the exact point they occur.

## Bad

```cmake
# Only ever built and tested in plain Debug/Release — sanitizers never run,
# so most memory-safety bugs ship silently until they crash in production.
add_executable(my_app main.cpp)
```

```cpp
// This bug passes every normal test run — the corrupted byte happens to
// land in unused padding, so nothing visibly breaks.
void write_bug(std::vector<int>& v) {
    int* p = v.data();
    p[v.size()] = 42;   // One-past-the-end write: heap buffer overflow
}
```

## Good

```cmake
option(ENABLE_SANITIZERS "Build with AddressSanitizer + UBSan" OFF)
if(ENABLE_SANITIZERS)
  add_compile_options(-fsanitize=address,undefined -fno-omit-frame-pointer -g)
  add_link_options(-fsanitize=address,undefined)
endif()
```

```bash
# Run the full test suite under sanitizers as a required CI job
cmake -B build-asan -DENABLE_SANITIZERS=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build-asan
ctest --test-dir build-asan
# ASan now reports the exact write_bug() overflow above with a stack trace.
```

## Sanitizer Coverage

| Sanitizer | Catches |
|---|---|
| AddressSanitizer (ASan) | Buffer overflow, use-after-free, double-free |
| UndefinedBehaviorSanitizer (UBSan) | Signed overflow, null deref, misaligned access, invalid casts |
| ThreadSanitizer (TSan) | Data races (cannot combine with ASan in one binary) |
| MemorySanitizer (MSan) | Use of uninitialized memory (Clang only) |

## See Also

- [lint-address-sanitizer](lint-address-sanitizer.md) - ASan setup in depth
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - UBSan setup in depth
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - TSan for concurrency bugs
