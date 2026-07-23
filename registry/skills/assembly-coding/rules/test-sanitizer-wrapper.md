# test-sanitizer-wrapper

> Run the C test harness under AddressSanitizer/UndefinedBehaviorSanitizer to catch memory-safety issues that surface through the asm routine's memory accesses

## Why It Matters

Sanitizers instrument memory accesses and arithmetic at the compiler level; a hand-written asm routine itself isn't directly instrumented, but any out-of-bounds write, use-after-free, or undefined-behavior-triggering condition it causes in memory the sanitizer *does* track (heap/stack allocations made by the surrounding C code) is still detected the moment it happens, giving you a precise stack trace instead of a mysterious later crash or silent corruption.

## Bad (Testing Without Sanitizers)

```bash
# Plain build, memory corruption from the asm routine may go undetected or crash far from the actual bug
gcc test_checksum.c checksum.o -o test_checksum
./test_checksum
```

## Good

```bash
# AddressSanitizer catches heap/stack buffer overflows and use-after-free precisely where they occur
gcc -fsanitize=address -g test_checksum.c checksum.o -o test_checksum_asan
./test_checksum_asan

# UndefinedBehaviorSanitizer catches signed overflow, misaligned access, etc. in the surrounding C code
gcc -fsanitize=undefined -g test_checksum.c checksum.o -o test_checksum_ubsan
./test_checksum_ubsan
```

## Example: Catching an Off-By-One Write From Asm

```c
/* test_checksum.c - deliberately undersized buffer to catch an asm routine that reads one byte too many */
uint8_t data[8];
memset(data, 0, sizeof(data));
compute_checksum(data, 9);   /* ASan flags this: 9 exceeds the actual 8-byte allocation */
```

```
==12345==ERROR: AddressSanitizer: heap-buffer-overflow on address ...
READ of size 1 at ... thread T0
    #0 compute_checksum ...
```

## Limitations to Keep in Mind

ASan/UBSan instrument the *C code calling into* the asm, and any memory the asm touches that was allocated/tracked by instrumented C code — but they cannot see inside the asm instructions themselves to flag, say, a register misuse that never actually touches out-of-bounds memory. Pair sanitizer runs with the disassembly review and debugger techniques described elsewhere in this skill for full coverage.

## See Also

- [test-c-harness-wrapper](test-c-harness-wrapper.md) - The harness this sanitizer build wraps
- [test-fuzz-via-wrapper](test-fuzz-via-wrapper.md) - Combining fuzzing with sanitizer instrumentation
- [safe-stack-overflow-bounds](safe-stack-overflow-bounds.md) - The class of bug this technique is especially good at catching
