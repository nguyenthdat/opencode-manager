# simd-masked-operations

> Use masked/predicated SIMD operations (AVX-512 mask registers, NEON predicated forms) to handle a loop's remainder without falling back to scalar code

## Why It Matters

Vector widths rarely divide the data count evenly; the traditional fix is a "vector loop + scalar tail loop" pair, which works but adds branching and code size. Masked operations let a single vector instruction process a partial vector — only the lanes selected by the mask actually read/write memory or contribute a result — eliminating the separate tail loop entirely on hardware that supports it.

## Bad (Separate Scalar Tail Loop)

```asm
# x86-64 AT&T - vector loop plus a separate scalar remainder loop (works, but two code paths)
.global sum_with_tail
sum_with_tail:
    # ... vector loop processes n/4*4 elements with addps ...
    # ... then a separate scalar loop handles the remaining n%4 elements ...
    ret
```

## Good (AVX-512 Masked Load/Store)

```asm
# x86-64 AT&T - AVX-512: a mask register lets the last (partial) chunk use the SAME vector instruction
.global sum_masked
sum_masked:
    # k1 built from the remaining element count via a compare/generate-mask instruction
    # e.g. after processing full 16-wide chunks, build a mask for the remaining r < 16 elements:
    mov   $1, %eax
    shl   %cl, %eax          # cl = remaining count; eax = (1 << remaining) - 1 pattern (illustrative)
    dec   %eax
    kmovw %eax, %k1
    vmovups (%rdi), %zmm0{%k1}{z}   # masked load: only active lanes load, others are zeroed
    vaddps  (%rsi), %zmm0, %zmm0{%k1}
    vmovups %zmm0, (%rdx){%k1}       # masked store: only active lanes write
    ret
```

## ARM64 SVE Equivalent (Length-Agnostic, Similar Idea)

```asm
// ARM64 (SVE) - predicate register built from the remaining count, single loop body handles all sizes
whilelt p0.s, x4, x3          // p0 = predicate: lane i active if (x4 + i) < x3 (remaining count)
ld1w    {z0.s}, p0/z, [x0, x4, lsl #2]
ld1w    {z1.s}, p0/z, [x1, x4, lsl #2]
fadd    z0.s, p0/m, z0.s, z1.s
st1w    {z0.s}, p0, [x2, x4, lsl #2]
```

## Availability Caveat

AVX-512 mask registers and ARM SVE predication are not universally available (AVX-512 is absent on many consumer CPUs; SVE is optional even on some ARMv8/9 implementations) — always provide a fallback path and detect support at runtime rather than assuming it.

## See Also

- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - The fallback this technique can sometimes eliminate
- [simd-riscv-vector-extension](simd-riscv-vector-extension.md) - RISC-V's own length-agnostic tail handling via vsetvli
- [ctrl-loop-unroll-tradeoff](ctrl-loop-unroll-tradeoff.md) - The traditional remainder-loop approach this can replace
