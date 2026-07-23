# anti-forgetting-vzeroupper

> Don't return from AVX code (or call into potentially-legacy-SSE code) without executing `vzeroupper` first

## Why It Matters

Skipping `vzeroupper` at the AVX-to-legacy-SSE boundary triggers a real, measurable performance penalty on several x86 microarchitectures (the CPU must save/restore the upper 128 bits of the vector registers internally), and because the program still produces correct results, this regression is easy to ship unnoticed and only shows up later as an unexplained slowdown clustered at that boundary.

## Bad

```asm
# x86-64 AT&T - AVX routine returns without clearing the upper vector state
.global avx_routine_wrong
avx_routine_wrong:
    vmovaps (%rdi), %ymm0
    vmulps  %ymm0, %ymm0, %ymm0
    vmovaps %ymm0, (%rdi)
    ret                          # BUG: no vzeroupper before returning to a caller of unknown AVX-awareness
```

## Good

```asm
# x86-64 AT&T - vzeroupper before returning
.global avx_routine
avx_routine:
    vmovaps (%rdi), %ymm0
    vmulps  %ymm0, %ymm0, %ymm0
    vmovaps %ymm0, (%rdi)
    vzeroupper
    ret
```

## Why This Slips Through Testing

The routine's *output* is completely correct with or without `vzeroupper` — this is purely a performance regression, not a correctness bug, so no functional test suite will ever catch a missing `vzeroupper`. It typically surfaces only when someone profiles the overall program and finds an unexplained slowdown clustered right at the boundary between AVX-optimized code and everything else, with no obvious cause in either side's own logic.

## Every Exit Path Needs It, Not Just the Main One

A routine with multiple return points (an early-exit error path, a loop-break condition) needs `vzeroupper` before *every* `ret`, not just the common-case one — a partial fix that only covers the main return path still leaves the penalty on the less-common paths.

```asm
# x86-64 AT&T - vzeroupper missing on the early-exit path
.global avx_routine_partial_fix
avx_routine_partial_fix:
    test %rsi, %rsi
    jz   .empty
    vmovaps (%rdi), %ymm0
    vmulps  %ymm0, %ymm0, %ymm0
    vmovaps %ymm0, (%rdi)
    vzeroupper
    ret
.empty:
    xor  %eax, %eax
    ret                       # BUG: this path used no AVX instructions itself, but if any AVX
                                # state remains dirty from an EARLIER call in the same thread,
                                # this early-exit path still needs to consider the transition
```

## See Also

- [simd-vzeroupper-transition](simd-vzeroupper-transition.md) - The full rule this anti-pattern violates
- [simd-avx-ymm-256](simd-avx-ymm-256.md) - AVX basics where this requirement first appears
- [test-golden-file-disasm](test-golden-file-disasm.md) - Catching a missing vzeroupper via disassembly review
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - How this regression typically gets noticed in practice
