# simd-horizontal-vs-vertical

> Prefer vertical (lane-parallel, across different data elements) SIMD operations over horizontal (within-one-vector, cross-lane) operations, which are typically slower

## Why It Matters

Vertical operations (`addps xmm_a, xmm_b` — add lane 0 to lane 0, lane 1 to lane 1, etc.) map directly onto the SIMD execution units at full throughput. Horizontal operations (`haddps`, or the pairwise-add idiom) shuffle data across lanes internally, which typically decodes into multiple micro-ops and has notably worse throughput than the equivalent vertical operation — they're a convenience instruction, not a fast one.

## Bad (Naive Horizontal Reduction in a Loop)

```asm
# x86-64 AT&T - horizontal add used repeatedly inside a hot loop: needlessly expensive
.global sum_pairs_wrong
sum_pairs_wrong:
.loop:
    movaps (%rdi,%rcx,4), %xmm0
    haddps %xmm0, %xmm0        # BUG: horizontal add inside the hot loop, on every iteration
    haddps %xmm0, %xmm0
    addss  %xmm0, %xmm1
    add    $4, %rcx
    cmp    %rsi, %rcx
    jl     .loop
    ret
```

## Good (Accumulate Vertically, Reduce Once at the End)

```asm
# x86-64 AT&T - accumulate with vertical adds throughout the loop, horizontal-reduce only once
.global sum_pairs
sum_pairs:
    xorps %xmm1, %xmm1        # accumulator, vertical throughout the loop
.loop:
    addps (%rdi,%rcx,4), %xmm1   # vertical add: cheap, full throughput
    add   $4, %rcx
    cmp   %rsi, %rcx
    jl    .loop
    # only reduce to a scalar ONCE, after the loop is done
    haddps %xmm1, %xmm1
    haddps %xmm1, %xmm1
    movss  %xmm1, (%rdx)
    ret
```

## The General Pattern

Keep a per-lane running accumulator throughout the hot loop using only vertical operations, and pay the (relatively fixed, one-time) cost of a horizontal reduction exactly once, after the loop completes — never inside the loop body.

## ARM64 Equivalent

```asm
// ARM64 - vertical fadd accumulator throughout, faddp reduction only at the end
fadd v1.4s, v1.4s, v0.4s     // vertical, inside the loop
// ... after the loop ...
faddp v1.4s, v1.4s, v1.4s      // horizontal reduce, once
faddp s0, v1.2s
```

## See Also

- [simd-data-layout-soa](simd-data-layout-soa.md) - Data layout that enables vertical-only inner loops
- [simd-neon-basic-vector](simd-neon-basic-vector.md) - Where the faddp reduction example above comes from
- [perf-instruction-level-parallelism](perf-instruction-level-parallelism.md) - Related throughput-maximization guidance
