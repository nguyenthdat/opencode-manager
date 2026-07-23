# abi-float-regs-separate

> Floating-point and vector arguments/returns use a separate register file (xmm/v/fa), independent of the integer argument count

## Why It Matters

Integer and floating-point arguments are assigned from independent counters. A `double` argument does not consume an integer argument register, and vice versa. Assuming a single unified "argument slot number" across both register files misplaces every argument after the first mixed-type one.

## Bad

```asm
# x86-64 AT&T (SysV)
# double weighted_sum(int64_t n, double w, int64_t m)
# Correct: n->rdi, w->xmm0, m->rsi  (NOT xmm1, and NOT rsi shifted by the float)
.global weighted_sum
weighted_sum:
    cvtsi2sd %rdi, %xmm1   # BUG: assumes w is the "2nd slot" -> wrong register
    mulsd    %xmm1, %xmm0
    # ...
    ret
```

## Good

```asm
# x86-64 AT&T (SysV) - n: rdi, w: xmm0, m: rsi
.global weighted_sum
weighted_sum:
    cvtsi2sd %rdi, %xmm1    # convert n to double in a scratch xmm reg
    mulsd    %xmm0, %xmm1   # xmm1 = n_as_double * w
    cvtsi2sd %rsi, %xmm0
    addsd    %xmm1, %xmm0   # xmm0 = m_as_double + (n*w)
    ret
```

## ARM64 Equivalent

```asm
// ARM64 (AAPCS64) - n: x0, w: d0, m: x1 (independent register files)
.global weighted_sum
weighted_sum:
    scvtf d1, x0
    fmul  d1, d1, d0
    scvtf d0, x1
    fadd  d0, d0, d1
    ret
```

## Register File Reference

| ISA | Integer/pointer args | Float/vector args |
|-----|-----------------------|---------------------|
| x86-64 SysV | rdi, rsi, rdx, rcx, r8, r9 | xmm0-xmm7 |
| ARM64 AAPCS64 | x0-x7 | v0-v7 (d/s aliases) |
| RISC-V | a0-a7 | fa0-fa7 |

## See Also

- [abi-sysv-amd64-args](abi-sysv-amd64-args.md) - Integer argument convention
- [abi-varargs-al](abi-varargs-al.md) - Counting vector registers for variadic calls
- [simd-sse-basic-xmm](simd-sse-basic-xmm.md) - More on xmm register usage
