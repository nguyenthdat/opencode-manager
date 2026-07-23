# test-fuzz-entry-point

> Expose a dedicated fuzz-testing entry point (`LLVMFuzzerTestOneInput`) for parsers and anything that handles untrusted input

## Why It Matters

Unit tests check the inputs you thought to write; fuzzing generates enormous numbers of malformed, adversarial, and edge-case inputs automatically and reports the exact crashing input when it finds a memory-safety or logic bug. Any C code that parses untrusted data (file formats, network protocols, config syntax) is exactly the kind of code where manual test cases systematically miss the inputs that matter most.

## Bad

```c
/* Only hand-written unit tests exercise the parser — never exposed to
 * automated, adversarial input generation. */
void test_parse_valid_packet(void) {
    assert(parse_packet(valid_bytes, sizeof(valid_bytes)) == 0);
}
```

## Good — libFuzzer Entry Point

```c
/* fuzz_parser.c */
#include <stdint.h>
#include <stddef.h>

int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    struct packet pkt;
    parse_packet(data, size, &pkt);   /* must never crash, leak, or read out of bounds
                                        * for ANY byte sequence, no matter how malformed */
    return 0;
}
```

```sh
clang -g -fsanitize=fuzzer,address,undefined fuzz_parser.c parser.c -o fuzz_parser
./fuzz_parser corpus/   # runs continuously, mutating inputs, until a crash or Ctrl-C
```

## AFL++ as an Alternative

```sh
afl-clang-fast -o fuzz_target fuzz_target.c parser.c
afl-fuzz -i seed_corpus -o findings -- ./fuzz_target @@
```

## Seed the Corpus With Real Examples

Starting from a corpus of real, valid inputs (sample files, captured packets) dramatically improves fuzzer coverage compared to starting from nothing, since the fuzzer mutates from a baseline that already exercises the "interesting" code paths.

## See Also

- [test-sanitizers-in-test-ci](test-sanitizers-in-test-ci.md) - Pairing fuzzing with sanitizer instrumentation
- [mem-avoid-buffer-overflow](mem-avoid-buffer-overflow.md) - The class of bug fuzzing is especially good at finding
- [test-boundary-value-testing](test-boundary-value-testing.md) - Manually-authored edge cases that complement fuzzing
