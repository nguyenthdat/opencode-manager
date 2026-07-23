# test-fuzz-entrypoints

> Provide libFuzzer entry points for parsers

## Why It Matters

Any function that parses untrusted, structured input (file formats, network protocols, user-supplied config) has an effectively unbounded input space that hand-written unit tests can't cover exhaustively. A fuzz entry point lets a coverage-guided fuzzer (libFuzzer, AFL++) automatically generate inputs that exercise edge cases — malformed lengths, unexpected byte sequences — that a human tester is unlikely to think of.

## Bad

```cpp
// No fuzz target at all — the parser is only exercised by a handful of
// hand-written "happy path" and "one obvious bad input" unit tests, leaving
// most of the malformed-input space completely untested.
Packet parse_packet(std::span<const std::byte> data);
```

## Good

```cpp
// fuzz/parse_packet_fuzzer.cpp
#include "packet_parser.hpp"

extern "C" int LLVMFuzzerTestOneInput(const uint8_t* data, size_t size) {
    try {
        auto packet = parse_packet(std::span(reinterpret_cast<const std::byte*>(data), size));
        (void)packet;   // Just needs to not crash/UB; sanitizers catch the rest
    } catch (const std::exception&) {
        // Expected for malformed input — parse_packet should never crash or
        // exhibit UB, only throw a well-defined exception for bad input.
    }
    return 0;
}
```

```cmake
add_executable(parse_packet_fuzzer fuzz/parse_packet_fuzzer.cpp)
target_link_libraries(parse_packet_fuzzer PRIVATE packet_parser)
target_compile_options(parse_packet_fuzzer PRIVATE -fsanitize=fuzzer,address,undefined)
target_link_options(parse_packet_fuzzer PRIVATE -fsanitize=fuzzer,address,undefined)
```

```bash
./parse_packet_fuzzer -max_total_time=300   # Run locally for 5 minutes
# Or integrate with OSS-Fuzz for continuous fuzzing of open-source projects
```

## Seed the Corpus With Real, Valid Inputs

```bash
mkdir corpus
cp test/fixtures/*.bin corpus/
./parse_packet_fuzzer corpus/   # Fuzzer mutates from these known-valid starting points
```

## See Also

- [mem-sanitizer-required](mem-sanitizer-required.md) - Sanitizers that fuzzing relies on to catch bugs
- [err-exceptions-vs-expected](err-exceptions-vs-expected.md) - Parsers should fail via exceptions/expected, never UB
- [test-sanitizer-ci](test-sanitizer-ci.md) - Running fuzz targets as part of CI
