# mem-align-directive

> Use `.align`/`.balign`/`.p2align` deliberately, and know which one takes a byte count vs a power of two

## Why It Matters

GAS's plain `.align N` directive means different things on different target architectures — a literal byte count on x86, but a power-of-two exponent on ARM and several other targets — so the same directive text can produce very different alignment depending only on which assembler backend processes it. Using the unambiguous `.balign` (byte alignment) or `.p2align` (power-of-two alignment) directive removes that ambiguity.

## Bad (Ambiguous, Target-Dependent)

```asm
# GAS - .align means different things on x86 vs ARM; don't rely on the default
.section .data
.align 16              # byte count on x86, but 2^16 on some other targets!
buffer: .skip 64
```

## Good

```asm
# GAS - unambiguous, works identically across all targets
.section .data
.balign 16              # always means "align to a 16-byte boundary"
buffer: .skip 64
```

## NASM Equivalent

```asm
; NASM (x86 only, byte-count semantics, no ambiguity to begin with)
section .data
align 16
buffer: times 64 db 0
```

## Aligning Code (Loop Entry Points)

```asm
# x86-64 AT&T (GAS) - align a hot loop's entry to a 16-byte boundary for icache/decode efficiency
.p2align 4, 0x90         # align to 2^4=16 bytes, pad with NOP (0x90) instead of garbage
.hot_loop:
    dec %rdi
    jnz .hot_loop
```

Using `0x90` (the `nop` opcode) as the pad byte for code alignment (rather than the default zero-fill) ensures any accidentally-executed padding is a harmless no-op rather than an invalid or dangerous instruction.

## See Also

- [mem-natural-alignment](mem-natural-alignment.md) - What alignment value to choose for each data type
- [mem-cache-line-alignment](mem-cache-line-alignment.md) - Aligning to cache-line size specifically
- [syntax-section-directives](syntax-section-directives.md) - Section directives these often accompany
