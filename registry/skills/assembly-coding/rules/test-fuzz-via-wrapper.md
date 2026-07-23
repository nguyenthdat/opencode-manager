# test-fuzz-via-wrapper

> Fuzz hand-written asm routines indirectly, by fuzzing their C wrapper function with a standard fuzzing harness

## Why It Matters

Fuzzers (libFuzzer, AFL++) operate at the level of a C/C++ function they can call repeatedly with generated inputs; they have no direct concept of an asm routine. Wrapping the asm routine in a normal C function (the same wrapper described in `interop-c-callable-wrapper`) makes it a completely ordinary fuzz target, and this is often the single most effective way to find edge-case bugs in hand-written asm — buffer boundary errors, integer overflow in address computation, and alignment assumptions that only manifest on specific byte patterns.

## Bad (No Fuzzing at All)

```
src/
  parse_header.s     # boundary/edge-case bugs likely lurk, undiscovered by unit tests alone
```

## Good

```c
/* fuzz_parse_header.c - libFuzzer harness calling the asm routine through its C wrapper */
#include <stdint.h>
#include <stddef.h>
#include "parse_header.h"

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    struct Header hdr;
    parse_header(data, size, &hdr);   /* asm routine under test, called exactly like any C function */
    return 0;
}
```

```bash
# Build and run with libFuzzer (Clang)
clang -fsanitize=fuzzer,address -c parse_header.s -o parse_header.o
clang -fsanitize=fuzzer,address fuzz_parse_header.c parse_header.o -o fuzz_parse_header
./fuzz_parse_header -max_total_time=120
```

## Seeding the Corpus With Known-Good Inputs

```bash
mkdir corpus
# Add a handful of valid, real-world header samples to give the fuzzer a starting point
cp samples/*.hdr corpus/
./fuzz_parse_header corpus/ -max_total_time=300
```

## Combining With Sanitizers

Since asm routines bypass the compiler's own instrumentation, pairing the fuzzer with AddressSanitizer on the *C wrapper and any C code it touches* still catches many memory-safety issues that surface through the wrapper's memory accesses, even though the asm itself isn't directly instrumented.

## See Also

- [test-sanitizer-wrapper](test-sanitizer-wrapper.md) - Running the C harness under ASan/UBSan more generally
- [interop-c-callable-wrapper](interop-c-callable-wrapper.md) - The wrapper this fuzzing approach depends on
- [test-unit-test-known-vectors](test-unit-test-known-vectors.md) - Deterministic tests to pair with fuzzing
