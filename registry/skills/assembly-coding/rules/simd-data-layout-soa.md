# simd-data-layout-soa

> Lay hot data out as Structure-of-Arrays (SoA) rather than Array-of-Structures (AoS) so SIMD loads pull in only the values you actually need

## Why It Matters

A packed SIMD load reads a contiguous block of memory into a vector register. If your data is laid out AoS (`{x,y,z}, {x,y,z}, ...`), a single vector load mixes multiple unrelated fields together, forcing extra shuffle/deinterleave instructions before the actual computation can happen. SoA (`{x,x,x,x,...}, {y,y,y,y,...}, {z,z,z,z,...}`) lets a vector load pull in four `x` values directly, ready for a packed op with no shuffling.

## Bad (AoS Layout)

```c
/* C - AoS: components are interleaved, awkward for SIMD */
struct Point { float x, y, z; };
struct Point points[1024];
```

```asm
# x86-64 AT&T - extracting just the x components requires a strided, non-contiguous gather
.global sum_x_aos
sum_x_aos:
    # each point is 12 bytes; x is at offset 0 -- no packed load grabs 4 x's contiguously
    # would need a gather instruction or scalar extraction loop
    ret
```

## Good (SoA Layout)

```c
/* C - SoA: each component lives in its own contiguous array */
struct Points {
    float x[1024];
    float y[1024];
    float z[1024];
};
```

```asm
# x86-64 AT&T - x values are contiguous; a single packed load grabs 4 of them at once
.global sum_x_soa
sum_x_soa:
    # float *x (rdi), long n (rsi) -> sum
    xorps %xmm0, %xmm0
    xor   %rcx, %rcx
.loop:
    addps (%rdi,%rcx,4), %xmm0     # 4 contiguous x values added per instruction
    add   $4, %rcx
    cmp   %rsi, %rcx
    jl    .loop
    # horizontal-reduce xmm0's 4 lanes into a scalar (see simd-horizontal-vs-vertical)
    ret
```

## When AoS Still Makes Sense

If code overwhelmingly accesses all fields of one record together (rather than one field across many records), AoS keeps that access pattern cache-friendly and SoA would instead scatter a single record's fields across three separate cache lines — profile the actual access pattern before restructuring.

## See Also

- [simd-horizontal-vs-vertical](simd-horizontal-vs-vertical.md) - Reducing SoA-friendly vertical sums to a scalar
- [perf-cache-line-access-pattern](perf-cache-line-access-pattern.md) - The broader cache-access-pattern principle
- [mem-cache-line-alignment](mem-cache-line-alignment.md) - Aligning each SoA array to cache-line boundaries
