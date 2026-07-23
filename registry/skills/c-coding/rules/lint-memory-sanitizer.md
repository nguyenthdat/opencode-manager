# lint-memory-sanitizer

> Use MemorySanitizer (`-fsanitize=memory`, Clang-only) to detect reads of uninitialized memory that other tools miss

## Why It Matters

AddressSanitizer and Valgrind catch many memory bugs but are not as precise as MemorySanitizer specifically for uninitialized-value reads — MSan tracks the "initialized" bit for every individual bit of memory, catching cases where a value happens to look plausible (a stack slot that used to hold a valid pointer) but was never actually assigned by the current function.

## Bad

```c
int classify(int score) {
    int grade;
    if (score >= 90) grade = 1;
    return grade;   /* uninitialized read for score < 90: may go unnoticed under ASan alone */
}
```

## Good

```sh
# MemorySanitizer requires ALL linked code (including libc, ideally) to be
# instrumented for accurate results; an MSan-instrumented libc/toolchain
# build is typically required for clean, false-positive-free results.
clang -g -O1 -fsanitize=memory -fno-omit-frame-pointer \
      -o test_bin test.c src/*.c
./test_bin
```

## Example Output

```
==12345==WARNING: MemorySanitizer: use-of-uninitialized-value
    #0 in classify parser.c:5
    #1 in main main.c:10
```

## Practical Caveats

MSan requires all dependencies (and ideally libc itself) to be built with MSan instrumentation for reliable results, which is a heavier setup cost than ASan/UBSan. Many projects use Valgrind's `--track-origins=yes` as a lower-setup-cost alternative that catches a similar class of bug, at some runtime performance cost, without requiring an instrumented toolchain.

## See Also

- [mem-init-before-use](mem-init-before-use.md) - The discipline this tool verifies
- [mem-valgrind-asan-verify](mem-valgrind-asan-verify.md) - The lower-setup-cost Valgrind alternative
- [ub-uninitialized-variable-read](ub-uninitialized-variable-read.md) - The specific UB category this tool targets
