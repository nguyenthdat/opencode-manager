# lint-address-sanitizer

> Build and run tests with AddressSanitizer (`-fsanitize=address`) to detect buffer overflows, use-after-free, and double-free at the exact point they occur

## Why It Matters

AddressSanitizer instruments every memory access and allocation, maintaining "red zones" around heap/stack/global allocations that immediately trigger a detailed error report — including both the faulting access and the allocation's original call stack — the instant an out-of-bounds access or a use-after-free happens, rather than letting it silently corrupt memory and surface as an unrelated crash later.

## Bad

```sh
cc -O2 -o test_bin test.c src/*.c   # no instrumentation: memory bugs may pass silently
./test_bin
```

## Good

```sh
cc -g -O1 -fsanitize=address -fno-omit-frame-pointer -o test_bin test.c src/*.c
ASAN_OPTIONS=detect_leaks=1:abort_on_error=1 ./test_bin
```

## Example Output on a Real Bug

```
==12345==ERROR: AddressSanitizer: heap-buffer-overflow on address 0x...
WRITE of size 4 at 0x... thread T0
    #0 in fill_array parser.c:42
    #1 in main main.c:10
0x... is located 0 bytes after a 40-byte region
allocated by thread T0 here:
    #0 in malloc
    #1 in alloc_array parser.c:30
```

## Performance and CI Fit

ASan typically adds ~2x runtime overhead and increased memory usage — acceptable for test/CI builds, not for production release builds. Run it as a dedicated CI job/matrix leg alongside (not instead of) a normal, unsanitized release build.

## See Also

- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - Frequently combined in the same build (`-fsanitize=address,undefined`)
- [mem-valgrind-asan-verify](mem-valgrind-asan-verify.md) - How ASan fits alongside Valgrind in a testing strategy
- [test-sanitizers-in-test-ci](test-sanitizers-in-test-ci.md) - Wiring this into CI concretely
