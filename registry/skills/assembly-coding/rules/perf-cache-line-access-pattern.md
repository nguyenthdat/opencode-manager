# perf-cache-line-access-pattern

> Access memory sequentially and in cache-line-sized chunks whenever possible so the hardware prefetcher and cache hierarchy work in your favor

## Why It Matters

CPUs load memory into cache one cache-line (typically 64 bytes) at a time, and hardware prefetchers are specifically tuned to detect sequential access patterns and fetch ahead of the program's actual reads. A strided or random access pattern defeats prefetching, forces a full cache-line fetch for every access regardless of how much of that line you actually use, and can turn a computation that should be CPU-bound into one that is memory-latency-bound instead.

## Bad (Strided Access Defeats the Cache)

```asm
# x86-64 AT&T - strided column-major access over a row-major matrix: poor cache locality
.global sum_column_wrong
sum_column_wrong:
    # int64_t sum_column(int64_t matrix[N][N], int64_t col, int64_t n)
    # accesses matrix[0][col], matrix[1][col], ... -- each access jumps a full row (large stride)
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    imul %r8, %rcx, %r9      # r9 = row_index * n  (n = row stride)
    add  %rdx, %r9              # + col
    add  (%rdi,%r9,8), %rax       # each access lands on a DIFFERENT cache line
    inc  %rcx
    cmp  %r8, %rcx
    jl   .loop
    ret
```

## Good (Sequential Access)

```asm
# x86-64 AT&T - row-major sequential access: consecutive elements share cache lines
.global sum_row
sum_row:
    # accesses matrix[row][0], matrix[row][1], ... -- sequential, prefetcher-friendly
    xor  %rax, %rax
    xor  %rcx, %rcx
.loop:
    add  (%rdi,%rcx,8), %rax    # each access is the NEXT 8 bytes -- stays within cache lines
    inc  %rcx
    cmp  %r8, %rcx
    jl   .loop
    ret
```

## Restructuring an Algorithm for Sequential Access

When both a row-major and column-major traversal of the same matrix are needed, restructure loops (loop tiling/blocking) so each pass processes data in the order it's actually stored, rather than fighting the storage layout — this is the same principle behind SIMD-friendly SoA layout described in `simd-data-layout-soa`, generalized to any memory access pattern.

## See Also

- [mem-cache-line-alignment](mem-cache-line-alignment.md) - Aligning data to cache-line boundaries
- [simd-data-layout-soa](simd-data-layout-soa.md) - A specific data-layout technique serving this same goal
- [perf-prefetch-hint](perf-prefetch-hint.md) - Explicit software prefetching for less-regular access patterns
