# mem-endianness-explicit

> Handle byte order explicitly when reading/writing multi-byte values that cross ISA or network boundaries

## Why It Matters

x86-64, ARM64, and RISC-V are all little-endian by default (ARM64 and RISC-V can run big-endian in specific configurations, but little-endian is overwhelmingly the common case), so a raw multi-byte load already matches native byte order for local data. The moment data comes from a network protocol, a file format, or a different-endian source, that assumption breaks, and reading it as-is produces byte-swapped garbage.

## Bad

```asm
# x86-64 AT&T - reads a big-endian (network byte order) 32-bit length as if native
.global read_length_wrong
read_length_wrong:
    mov  (%rdi), %eax    # BUG: if the source is big-endian, this value is byte-swapped
    ret
```

## Good

```asm
# x86-64 AT&T - explicitly byte-swap a big-endian value after loading
.global read_length_be
read_length_be:
    mov  (%rdi), %eax
    bswap %eax           # convert big-endian value to native little-endian
    ret
```

## bswap / rev Reference

| ISA | Instruction | Notes |
|---|---|---|
| x86-64 | `bswap %eax` / `bswap %rax` | 32-bit / 64-bit byte swap |
| ARM64 | `rev w0, w0` / `rev x0, x0` | 32-bit / 64-bit byte swap |
| RISC-V | no single instruction in base ISA | use `Zbb` extension's `rev8`, or shift/mask manually |

## Manual Byte Swap (Portable Fallback)

```asm
# RISC-V (RV64) - manual 32-bit byte swap without the Zbb extension
.globl bswap32
bswap32:
    # a0 = value to swap, result in a0
    srli t0, a0, 24
    andi t0, t0, 0xff       # t0 = byte 3
    slli t1, a0, 24
    or   a0, t0, t1          # partial; full implementation needs all 4 bytes
    ret                        # (illustrative — prefer the Zbb rev8 instruction when available)
```

## See Also

- [mem-natural-alignment](mem-natural-alignment.md) - Another cross-ISA data-layout concern
- [interop-struct-layout-agreement](interop-struct-layout-agreement.md) - Matching layouts across languages, including byte order
- [doc-abi-assumption-comment](doc-abi-assumption-comment.md) - Documenting endianness assumptions at the top of a file
