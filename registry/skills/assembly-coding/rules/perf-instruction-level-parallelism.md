# perf-instruction-level-parallelism

> Structure independent computations so the CPU's out-of-order execution engine can run them in parallel, instead of forcing an artificial sequential chain

## Why It Matters

Modern CPUs can execute several independent instructions per cycle, but only if those instructions truly don't depend on each other. Writing a single long dependency chain (each instruction waiting on the previous one's result) when the underlying computation is actually parallelizable leaves throughput on the table — the CPU is capable of more work per cycle than a serialized instruction stream can expose.

## Bad (Serial Dependency Chain)

```asm
# x86-64 AT&T - four sequential adds into the SAME accumulator: each depends on the previous
.global sum_four_wrong
sum_four_wrong:
    mov  (%rdi), %rax
    add  8(%rdi), %rax     # depends on the previous add completing
    add  16(%rdi), %rax     # depends on THAT add completing
    add  24(%rdi), %rax      # and so on -- fully serialized
    ret
```

## Good (Independent Partial Sums, Combined at the End)

```asm
# x86-64 AT&T - two independent partial sums can execute in parallel, combined only at the end
.global sum_four
sum_four:
    mov  (%rdi), %rax
    mov  8(%rdi), %rcx
    add  16(%rdi), %rax     # independent from the next line -- can run in parallel
    add  24(%rdi), %rcx      # independent from the previous line
    add  %rcx, %rax           # final combine, only this step depends on both partial sums
    ret
```

## The General Pattern: Multiple Accumulators

This is the same principle behind unrolling a reduction loop with several accumulators instead of one — each accumulator's chain is independent of the others, letting the CPU interleave their execution, with a final combining step only at the very end.

```asm
# x86-64 AT&T - illustrative: two independent accumulators in a reduction loop
.global sum_array_two_acc
sum_array_two_acc:
    xor %rax, %rax      # accumulator A
    xor %rcx, %rcx        # accumulator B, independent chain
.loop:
    add (%rdi,%rdx,8), %rax
    add 8(%rdi,%rdx,8), %rcx
    add $2, %rdx
    cmp %rsi, %rdx
    jl  .loop
    add %rcx, %rax          # combine only once, at the end
    ret
```

## See Also

- [perf-avoid-false-dependency](perf-avoid-false-dependency.md) - Avoiding artificial dependencies specifically
- [ctrl-loop-unroll-tradeoff](ctrl-loop-unroll-tradeoff.md) - Unrolling as a vehicle for exposing independent work
- [simd-horizontal-vs-vertical](simd-horizontal-vs-vertical.md) - The vector analog of "combine only at the end"
