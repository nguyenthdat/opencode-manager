# doc-algorithm-reference

> Cite the algorithm, paper, or reference implementation a nontrivial routine is based on, with enough detail to look it up

## Why It Matters

A hand-optimized asm implementation of a nontrivial algorithm (a CRC variant, a specific hashing scheme, a particular fast-inverse-square-root-style bit trick) is often unrecognizable from the code alone, especially once it's been restructured for performance. A citation lets a future maintainer verify the implementation against the original source, understand *why* a particular polynomial or constant appears, and find test vectors from the original reference.

## Bad

```asm
# x86-64 AT&T - a specific CRC polynomial and reflection trick with no indication of the algorithm behind it
.global crc_step
crc_step:
    xor  %esi, %eax
    mov  $8, %ecx
.Lbit_loop:
    shr  $1, %eax
    jnc  .Lno_xor
    xor  $0xEDB88320, %eax     # what is this constant? why this specific value?
.Lno_xor:
    loop .Lbit_loop
    ret
```

## Good

```asm
# x86-64 AT&T
# Implements one byte-step of CRC-32 (reflected, polynomial 0xEDB88320 == the standard
# CRC-32/ISO-HDLC polynomial 0x04C11DB7 bit-reversed).
# Reference: "A Painless Guide to CRC Error Detection Algorithms" (Ross N. Williams, 1993),
# section 9 ("A Reflected Table-less Implementation").
.global crc_step
crc_step:
    xor  %esi, %eax
    mov  $8, %ecx
.Lbit_loop:
    shr  $1, %eax
    jnc  .Lno_xor
    xor  $0xEDB88320, %eax
.Lno_xor:
    loop .Lbit_loop
    ret
```

## What Counts as a Good Citation

- A specific paper, RFC, or standard document (with a section number if the algorithm is long)
- A well-known reference implementation (e.g. "matches zlib's crc32.c table-generation approach")
- The name of a well-established algorithm ("Barrett reduction", "Duff's device", "Bresenham's line algorithm") that a reader can independently look up

## When No External Reference Exists

If the algorithm is original to the project, say so and explain the derivation inline instead — the point is giving the reader *some* path to independently verify correctness, whether that's an external citation or a from-scratch derivation.

## See Also

- [doc-bit-trick-explain](doc-bit-trick-explain.md) - Explaining the "how", complementary to citing the "what/where"
- [doc-entry-register-contract](doc-entry-register-contract.md) - The broader documentation practice this fits into
