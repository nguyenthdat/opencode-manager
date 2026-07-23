# ctrl-loop-unroll-tradeoff

> Unroll hot loops only after measuring, and weigh the reduced branch overhead against larger code size and instruction-cache pressure

## Why It Matters

Unrolling reduces the number of loop-control instructions (compare, branch, counter update) executed per element processed, which helps when those instructions are a real bottleneck. But unrolling also multiplies code size, which can push a hot loop out of the L1 instruction cache or the CPU's loop-stream buffer, making the "optimized" version slower in practice.

## Bad (Unrolled Without Measurement, and With a Bug)

```asm
# x86-64 AT&T - unrolled 4x, but doesn't handle counts that aren't multiples of 4
.global sum_array_wrong
sum_array_wrong:
    # int64_t sum_array_wrong(int64_t *arr, int64_t n)
    xor  %eax, %eax
    xor  %rcx, %rcx
.loop:
    add  (%rdi,%rcx,8), %rax
    add  8(%rdi,%rcx,8), %rax
    add  16(%rdi,%rcx,8), %rax
    add  24(%rdi,%rcx,8), %rax
    add  $4, %rcx
    cmp  %rsi, %rcx
    jl   .loop               # BUG: if n isn't a multiple of 4, this reads past the array
    ret
```

## Good

```asm
# x86-64 AT&T - unrolled with a scalar remainder loop for the tail
.global sum_array
sum_array:
    xor  %eax, %eax
    xor  %rcx, %rcx
    mov  %rsi, %rdx
    and  $-4, %rdx          # rdx = n rounded down to a multiple of 4
.unrolled:
    cmp  %rdx, %rcx
    jge  .remainder
    add  (%rdi,%rcx,8), %rax
    add  8(%rdi,%rcx,8), %rax
    add  16(%rdi,%rcx,8), %rax
    add  24(%rdi,%rcx,8), %rax
    add  $4, %rcx
    jmp  .unrolled
.remainder:
    cmp  %rsi, %rcx
    jge  .done
    add  (%rdi,%rcx,8), %rax
    inc  %rcx
    jmp  .remainder
.done:
    ret
```

## When to Unroll

| Situation | Unroll? |
|---|---|
| Loop body is tiny and iteration count is large/hot | Often yes, measure first |
| Compiler already vectorizes/unrolls at `-O2`/`-O3` | Usually let it; hand-unrolling duplicates work |
| Loop count is small or unknown at compile time | Rarely worth it; remainder handling adds complexity |
| Code size / icache pressure is already a concern | No |

## See Also

- [ctrl-avoid-mispredict-hot-loop](ctrl-avoid-mispredict-hot-loop.md) - Related hot-loop structuring concerns
- [simd-data-layout-soa](simd-data-layout-soa.md) - Vectorizing instead of (or in addition to) unrolling
- [perf-profile-before-hand-tuning](perf-profile-before-hand-tuning.md) - Measure before applying either technique
