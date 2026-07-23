# anti-ignoring-endianness

> Don't ignore byte order when reading multi-byte values that originate from a network protocol, file format, or a different-endian source

## Why It Matters

Every mainstream ISA covered by this skill defaults to little-endian in its common configurations, so code that never explicitly handles endianness "works" until it encounters genuinely big-endian input (network protocols, several file formats, some legacy or specialized hardware) — at which point every multi-byte value comes out byte-swapped, with no error or crash to flag the mistake.

## Bad

```asm
# x86-64 AT&T - reads a network-byte-order (big-endian) length as if it were native
.global read_length_wrong
read_length_wrong:
    mov  (%rdi), %eax    # BUG: if the source is big-endian, this is byte-swapped garbage
    ret
```

## Good

```asm
# x86-64 AT&T - explicitly byte-swap a known-big-endian value after loading
.global read_length_be
read_length_be:
    mov  (%rdi), %eax
    bswap %eax
    ret
```

## ARM64 Equivalent

```asm
// ARM64 - rev correctly byte-swaps a big-endian value after loading
.global read_length_be
read_length_be:
    ldr w0, [x0]
    rev w0, w0
    ret
```

## Where This Bug Hides Longest

The bug is invisible on any little-endian-only test data, including most local development and CI fixtures generated on the same machine that consumes them — it only surfaces once real cross-endian data (a network packet captured on a different platform, a file produced by different hardware) reaches the routine, often long after the routine shipped and was believed correct.

## Don't Assume "It's All Little-Endian Anyway"

While true that x86-64, and the overwhelmingly common configurations of ARM64 and RISC-V, all default to little-endian, this does not extend to *data formats* those platforms consume — network protocols (most IETF-defined wire formats are big-endian/"network byte order"), some image and audio container formats, and various legacy file formats remain big-endian regardless of the host CPU's native order.

## See Also

- [mem-endianness-explicit](mem-endianness-explicit.md) - The full rule this anti-pattern violates
- [interop-struct-layout-agreement](interop-struct-layout-agreement.md) - Related cross-language data-layout correctness
- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - Documenting the endianness assumption explicitly
- [test-unit-test-known-vectors](test-unit-test-known-vectors.md) - Testing with real cross-endian input, not just local fixtures
