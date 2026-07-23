# lint-address-sanitizer

> Build and test regularly with AddressSanitizer

## Why It Matters

AddressSanitizer (ASan) instruments memory accesses to detect buffer overflows (both heap and stack), use-after-free, use-after-return, and double-free at the exact instruction that triggers them, with a full stack trace — turning silent memory corruption into an immediate, actionable failure with far less overhead (roughly 2x slowdown) than tools like Valgrind.

## Bad

```cmake
# ASan never enabled anywhere in the build/test matrix — heap overflows and
# use-after-free bugs ship silently until they cause an unrelated crash.
add_executable(myapp main.cpp)
```

## Good

```cmake
option(ENABLE_ASAN "Build with AddressSanitizer" OFF)
if(ENABLE_ASAN)
  add_compile_options(-fsanitize=address -fno-omit-frame-pointer -g -O1)
  add_link_options(-fsanitize=address)
endif()
```

```bash
cmake -B build-asan -DENABLE_ASAN=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build-asan
ASAN_OPTIONS=detect_leaks=1 ctest --test-dir build-asan
```

## Example Output

```
==12345==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x...
WRITE of size 4 at 0x... thread T0
    #0 write_bug(std::vector<int>&) widget.cpp:42
    #1 main main.cpp:10
0x... is located 0 bytes after a 40-byte region
allocated by thread T0 here:
    #0 operator new(unsigned long)
    #1 std::vector<int>::_M_realloc_insert(...)
```

## CI Integration

```yaml
test-asan:
  script:
    - cmake -B build-asan -DENABLE_ASAN=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
    - cmake --build build-asan
    - ctest --test-dir build-asan --output-on-failure
```

## Caveats

ASan cannot run in the same binary as ThreadSanitizer; run them as separate CI jobs. LeakSanitizer (leak detection) is bundled with ASan by default on most platforms.

## See Also

- [mem-sanitizer-required](mem-sanitizer-required.md) - The broader sanitizer strategy this fits into
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - Commonly combined with ASan in one build
- [lint-thread-sanitizer](lint-thread-sanitizer.md) - The separate build needed for race detection
