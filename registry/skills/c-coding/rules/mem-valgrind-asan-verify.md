# mem-valgrind-asan-verify

> Verify allocator discipline continuously with Valgrind and/or AddressSanitizer, not just code review

## Why It Matters

Memory bugs (leaks, use-after-free, double-free, out-of-bounds) are frequently invisible in normal testing because undefined behavior often "happens to work." Dynamic tools instrument every allocation and every memory access at runtime and report the exact bug location, which is far more reliable than manual auditing.

## Bad

```c
/* Relying only on "it ran without crashing" as evidence of correctness */
int main(void) {
    run_all_tests();
    return 0;   /* passing tests here proves nothing about leaks or UB */
}
```

## Good

```sh
# AddressSanitizer + UndefinedBehaviorSanitizer: fast, run on every CI build
cc -fsanitize=address,undefined -g -O1 -o test_bin test.c
./test_bin

# Valgrind memcheck: slower, catches uninitialized reads and leaks
# without recompiling with sanitizers
valgrind --leak-check=full --show-leak-kinds=all --track-origins=yes ./test_bin
```

```c
/* Make leak checks part of the test harness itself: */
#include <stdlib.h>

int main(void) {
    run_all_tests();
#ifdef __SANITIZE_ADDRESS__
    /* ASan reports leaks automatically at exit when built with
     * ASAN_OPTIONS=detect_leaks=1 (default on Linux). */
#endif
    return 0;
}
```

## What Each Tool Catches Best

| Tool | Strength |
|------|----------|
| AddressSanitizer (ASan) | Out-of-bounds, use-after-free, double-free, fast |
| UndefinedBehaviorSanitizer (UBSan) | Signed overflow, misaligned access, invalid casts |
| MemorySanitizer (MSan) | Uninitialized reads (needs instrumented dependencies) |
| Valgrind memcheck | Leak detection, uninitialized reads, no recompilation needed |
| ThreadSanitizer (TSan) | Data races between threads |

## See Also

- [lint-address-sanitizer](lint-address-sanitizer.md) - ASan setup details
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - UBSan setup details
- [test-sanitizers-in-test-ci](test-sanitizers-in-test-ci.md) - Wiring sanitizers into CI
