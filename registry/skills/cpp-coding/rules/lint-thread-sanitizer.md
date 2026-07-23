# lint-thread-sanitizer

> Build and test concurrent code with ThreadSanitizer

## Why It Matters

Data races are notoriously hard to reproduce by testing alone — they depend on precise thread scheduling that may only manifest once in a million runs on real hardware. ThreadSanitizer (TSan) instruments every memory access and synchronization operation to detect races deterministically-enough in practice, reporting the exact two conflicting accesses and both thread's stack traces, without needing the race to actually corrupt visible output.

## Bad

```cmake
# Concurrent code is only ever tested in a plain, unsanitized build — races
# that "happen to work" on the CI machine's specific scheduling may fail
# unpredictably on different hardware, load conditions, or compiler versions.
add_executable(myapp main.cpp worker_pool.cpp)
```

## Good

```cmake
option(ENABLE_TSAN "Build with ThreadSanitizer" OFF)
if(ENABLE_TSAN)
  add_compile_options(-fsanitize=thread -g -O1)
  add_link_options(-fsanitize=thread)
endif()
```

```bash
cmake -B build-tsan -DENABLE_TSAN=ON -DCMAKE_BUILD_TYPE=RelWithDebInfo
cmake --build build-tsan
ctest --test-dir build-tsan
```

## Example Output

```
WARNING: ThreadSanitizer: data race (pid=12345)
  Write of size 4 at 0x... by thread T2:
    #0 Stats::record(int) stats.cpp:8
  Previous write of size 4 at 0x... by thread T1:
    #0 Stats::record(int) stats.cpp:8
```

## TSan Cannot Combine With ASan in the Same Binary

```yaml
# Run as separate CI jobs, since ASan and TSan use incompatible runtime
# instrumentation and cannot be combined in a single binary:
test-asan-ubsan:
  script: [ ... -DENABLE_SANITIZERS=ON ... ]
test-tsan:
  script: [ ... -DENABLE_TSAN=ON ... ]
```

## See Also

- [conc-avoid-data-races](conc-avoid-data-races.md) - The bug class TSan specifically detects
- [mem-sanitizer-required](mem-sanitizer-required.md) - The broader sanitizer strategy
- [conc-memory-order-relaxed-care](conc-memory-order-relaxed-care.md) - Subtle ordering bugs TSan can help surface
