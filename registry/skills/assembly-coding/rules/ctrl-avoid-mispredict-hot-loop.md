# ctrl-avoid-mispredict-hot-loop

> Structure hot loops so their exit and inner branches are as predictable as possible

## Why It Matters

Branch predictors learn patterns extremely well (a loop's backward branch is predicted "taken" almost perfectly after a couple of iterations), but a data-dependent branch inside the loop body with no pattern mispredicts on roughly half its executions, and each misprediction flushes the pipeline. Restructuring the loop to remove or regularize that inner branch often matters far more than the loop's own control-flow overhead.

## Bad

```asm
# x86-64 AT&T - inner branch depends on unpredictable data (e.g. random sign)
.global sum_positive_wrong
sum_positive_wrong:
    # int64_t sum_positive(int64_t *arr, int64_t n)
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    cmp  %rsi, %rcx
    jge  .done
    mov  (%rdi,%rcx,8), %rdx
    cmp  $0, %rdx
    jle  .skip                # BUG-prone: mispredicts constantly on random data
    add  %rdx, %rax
.skip:
    inc  %rcx
    jmp  .loop
.done:
    ret
```

## Good

```asm
# x86-64 AT&T - branchless: cmov instead of an unpredictable inner branch
.global sum_positive
sum_positive:
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    cmp  %rsi, %rcx
    jge  .done                # loop exit branch: highly predictable, fine to keep
    mov  (%rdi,%rcx,8), %rdx
    xor  %r8, %r8
    test %rdx, %rdx
    cmovg %rdx, %r8            # r8 = (rdx > 0) ? rdx : 0, no unpredictable branch
    add  %r8, %rax
    inc  %rcx
    jmp  .loop
.done:
    ret
```

## Which Branches to Worry About

| Branch | Predictability | Action |
|---|---|---|
| Loop back-edge (bottom of loop to top) | Very high (predicted "taken" after warm-up) | Leave as a branch |
| Loop exit condition | Very high | Leave as a branch |
| Data-dependent branch on random/unpredictable input | Low | Replace with `cmov`/`csel`/masking |
| Data-dependent branch on skewed/sorted input | Often high | Measure before "fixing" it |

## See Also

- [ctrl-cmov-branchless](ctrl-cmov-branchless.md) - The branchless technique used above
- [ctrl-loop-unroll-tradeoff](ctrl-loop-unroll-tradeoff.md) - Another hot-loop restructuring technique
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Confirm this is actually the bottleneck first
