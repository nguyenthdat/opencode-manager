# mem-natural-alignment

> Align every data item to its own size: 2 bytes for 16-bit, 4 for 32-bit, 8 for 64-bit, 16 for SSE vectors

## Why It Matters

Natural alignment means a value's address is a multiple of its size. Several instructions require it outright (aligned SIMD loads fault otherwise), and even where the hardware tolerates misalignment, it typically costs extra cycles or an extra memory access that crosses a cache line.

## Bad

```asm
# x86-64 AT&T (GAS) - data section with no alignment control between items
.section .data
byte_flag:  .byte 1
counter:    .quad 0      # not guaranteed to start on an 8-byte boundary
```

## Good

```asm
# x86-64 AT&T (GAS) - explicit alignment before each naturally-aligned item
.section .data
byte_flag:  .byte 1
            .align 8
counter:    .quad 0       # now guaranteed 8-byte aligned
```

## Alignment Requirements by Type

| Data type | Natural alignment |
|---|---|
| byte | 1 |
| 16-bit word | 2 |
| 32-bit dword | 4 |
| 64-bit qword | 8 |
| SSE (xmm, 128-bit) | 16 |
| AVX (ymm, 256-bit) | 32 |
| AVX-512 (zmm, 512-bit) | 64 |

## ARM64 and RISC-V

```asm
// ARM64 (GAS)
.section .data
byte_flag: .byte 1
           .align 3        // .align N means 2^N bytes on GAS/ARM -> 8-byte align
counter:   .quad 0
```

```asm
# RISC-V (GAS)
.section .data
byte_flag: .byte 1
           .align 3         # 2^3 = 8-byte alignment
counter:   .dword 0
```

Note that GAS's `.align` argument means different things on different targets (a byte count on x86, a power of two on ARM/RISC-V) — always check the target's documentation, or use `.balign N` for an unambiguous byte-count alignment everywhere.

## See Also

- [mem-align-directive](mem-align-directive.md) - `.align`/`.balign` directive semantics in depth
- [mem-arm64-alignment-fault](mem-arm64-alignment-fault.md) - Consequences of getting this wrong on ARM64
- [mem-x86-unaligned-penalty](mem-x86-unaligned-penalty.md) - Consequences on x86
- [mem-cache-line-alignment](mem-cache-line-alignment.md) - Aligning to cache-line boundaries, a coarser concern
