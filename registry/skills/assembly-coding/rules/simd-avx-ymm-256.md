# simd-avx-ymm-256

> Use AVX's 256-bit ymm registers for 8 floats/4 doubles per instruction, and insert `vzeroupper` before calling non-AVX-aware code

## Why It Matters

AVX doubles SSE's vector width and introduces the three-operand `v`-prefixed instruction forms, which also avoid a false dependency on the destination register's previous value (SSE's two-operand form reads-modifies-writes the destination). But mixing legacy SSE and AVX code without a `vzeroupper` transition incurs a significant frequency/performance penalty on many CPUs (the "SSE/AVX transition penalty"), so it must be inserted at the right boundary.

## Bad

```asm
# x86-64 AT&T - AVX code that calls into (possibly) legacy-SSE library code with no transition
.global sum_avx_wrong
sum_avx_wrong:
    vmovaps (%rdi), %ymm0
    vaddps  (%rsi), %ymm0, %ymm0
    vmovaps %ymm0, (%rdx)
    call some_legacy_sse_function   # BUG: no vzeroupper -> possible AVX/SSE transition penalty
    ret
```

## Good

```asm
# x86-64 AT&T - vzeroupper before calling out to code that may use legacy SSE
.global sum_avx
sum_avx:
    vmovaps (%rdi), %ymm0
    vaddps  (%rsi), %ymm0, %ymm0
    vmovaps %ymm0, (%rdx)
    vzeroupper                    # clears the upper 128 bits of all ymm registers, avoids the penalty
    call some_legacy_sse_function
    ret
```

## AVX's Three-Operand Form Avoids Extra Moves

```asm
# x86-64 AT&T - AVX: dst, src1, src2 -- no need to copy src1 into dst first, unlike SSE's addps
vaddps %ymm1, %ymm0, %ymm2    # ymm2 = ymm0 + ymm1; ymm0 and ymm1 both preserved
```

Compare to SSE, which must first copy one operand into the destination:
```asm
# x86-64 AT&T - SSE's two-operand form destroys one input
movaps %xmm0, %xmm2
addps  %xmm1, %xmm2           # xmm2 = xmm0 + xmm1, but only after the extra copy
```

## Checking AVX Availability at Runtime

```c
/* C - runtime feature detection before dispatching to an AVX code path */
if (__builtin_cpu_supports("avx2")) {
    process_avx2(data, len);
} else {
    process_scalar(data, len);
}
```

## See Also

- [simd-sse-basic-xmm](simd-sse-basic-xmm.md) - The narrower SSE baseline this extends
- [simd-vzeroupper-transition](simd-vzeroupper-transition.md) - The vzeroupper rule in more depth
- [simd-fallback-scalar-path](simd-fallback-scalar-path.md) - Providing a non-AVX code path
