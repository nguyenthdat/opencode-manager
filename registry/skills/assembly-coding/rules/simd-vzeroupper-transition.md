# simd-vzeroupper-transition

> Execute `vzeroupper` before transferring control from AVX code to code that might use legacy (non-VEX-encoded) SSE instructions

## Why It Matters

Several x86 microarchitectures track whether the upper 128 bits of the ymm/zmm registers hold "dirty" (non-zero) state; executing a legacy SSE instruction while that upper state is dirty triggers a save/restore penalty (the "AVX/SSE transition penalty") that can cost dozens of cycles, repeated on every such transition. `vzeroupper` explicitly zeroes that upper state and tells the CPU the transition is clean, at negligible cost itself.

## Bad

```asm
# x86-64 AT&T - AVX routine returns to a caller that might use legacy SSE elsewhere, no transition
.global avx_routine_wrong
avx_routine_wrong:
    vmovaps (%rdi), %ymm0
    vmulps  %ymm0, %ymm0, %ymm0
    vmovaps %ymm0, (%rdi)
    ret                          # BUG: caller's subsequent SSE code may hit the transition penalty
```

## Good

```asm
# x86-64 AT&T - vzeroupper before returning to a caller of unknown AVX-awareness
.global avx_routine
avx_routine:
    vmovaps (%rdi), %ymm0
    vmulps  %ymm0, %ymm0, %ymm0
    vmovaps %ymm0, (%rdi)
    vzeroupper
    ret
```

## When You Can Skip It

If you know the entire call chain — every function this one calls and every function that calls it — exclusively uses AVX/VEX-encoded instructions (or exclusively pure integer code with no xmm/ymm usage at all), the transition never occurs and `vzeroupper` is unnecessary overhead. In any library or general-purpose routine where the caller is unknown, include it defensively.

## Where This Commonly Bites

Mixed codebases that call into an AVX-optimized routine from otherwise SSE2-baseline code (common when only some hot paths were vectorized with AVX) are the classic case; profilers sometimes surface this as unexplained slowdowns clustered right at the boundary between the two code regions.

## See Also

- [simd-avx-ymm-256](simd-avx-ymm-256.md) - AVX basics where this rule was introduced
- [anti-forgetting-vzeroupper](anti-forgetting-vzeroupper.md) - The anti-pattern this rule prevents
- [test-golden-file-disasm](test-golden-file-disasm.md) - Catching a missing vzeroupper via disassembly review
