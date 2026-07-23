# mem-x86-unaligned-penalty

> x86 tolerates most unaligned accesses but pays a real performance penalty, and some SIMD instructions still fault

## Why It Matters

x86's memory model permits unaligned scalar loads/stores to normal memory, so misaligned code usually runs correctly — which makes the resulting performance regression easy to miss during testing. Aligned SIMD instructions (`movaps`, `movdqa`) are the important exception: they raise a general-protection fault on a misaligned address rather than merely running slower.

## Bad

```asm
# x86-64 AT&T - movaps requires 16-byte alignment; this can fault
.global load_vector_wrong
load_vector_wrong:
    movaps (%rdi), %xmm0   # BUG if rdi isn't 16-byte aligned: #GP fault
    ret
```

## Good

```asm
# x86-64 AT&T - use the unaligned-safe load when alignment isn't guaranteed
.global load_vector
load_vector:
    movups (%rdi), %xmm0   # tolerates any alignment (may still be slower if misaligned)
    ret
```

Prefer `movaps`/`movdqa` (and align your buffers to 16/32/64 bytes) whenever you control the allocation, since aligned loads are typically faster than `movups`/`movdqu` on the same aligned address on many microarchitectures — but only after you've verified the alignment guarantee actually holds.

## Scalar Unaligned Access: Usually Fine, Sometimes Slow

```asm
# x86-64 AT&T - works regardless of alignment, but a load/store straddling
# a cache-line boundary costs extra cycles
mov (%rdi), %rax    # rdi need not be 8-byte aligned; may split across cache lines
```

## Guaranteeing Alignment for Aligned Loads

```c
/* C - request aligned storage before using movaps on it */
alignas(16) double buffer[4];
```

```asm
# x86-64 AT&T (GAS) - static buffer aligned for SIMD use
.section .bss
.align 16
simd_buffer: .skip 32   # 2 x 16-byte slots
```

## See Also

- [mem-natural-alignment](mem-natural-alignment.md) - General alignment-by-type guidance
- [mem-arm64-alignment-fault](mem-arm64-alignment-fault.md) - The stricter ARM64 failure mode
- [simd-alignment-requirement](simd-alignment-requirement.md) - SIMD-specific alignment rules in depth
