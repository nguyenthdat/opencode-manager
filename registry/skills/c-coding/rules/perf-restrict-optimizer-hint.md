# perf-restrict-optimizer-hint

> Add `restrict` to pointer parameters in hot numeric loops once you've verified no aliasing, to let the compiler vectorize more aggressively

## Why It Matters

Without `restrict`, the compiler must conservatively assume any two pointer parameters might alias the same memory, which prevents certain optimizations — most notably auto-vectorization, since the compiler can't safely reorder or batch loads/stores that might overlap. Adding `restrict` where the non-aliasing guarantee genuinely holds can be the difference between a scalar loop and a SIMD-vectorized one.

## Bad

```c
/* Compiler must assume dst could overlap a or b, so it re-checks/re-loads
 * conservatively and often can't vectorize this loop at all. */
void axpy(double *dst, const double *a, const double *b, double scale, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dst[i] = a[i] * scale + b[i];
    }
}
```

## Good

```c
void axpy(double *restrict dst, const double *restrict a,
          const double *restrict b, double scale, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dst[i] = a[i] * scale + b[i];   /* compiler can now vectorize freely */
    }
}
```

## Measuring the Actual Impact

```sh
cc -O3 -march=native -ftree-vectorize -fopt-info-vec file.c   # -fopt-info-vec reports which loops were/weren't vectorized
```

Confirm with a benchmark, not just the vectorization report — the real-world win depends on memory bandwidth, loop trip count, and whether the loop was actually the bottleneck.

## The Correctness Obligation Comes First

Only add `restrict` after confirming (by API contract or explicit checks) that the pointers genuinely never alias — see `ub-restrict-correctness` for the undefined-behavior consequence of getting this wrong.

## See Also

- [ub-restrict-correctness](ub-restrict-correctness.md) - The correctness contract `restrict` requires
- [ptr-restrict-keyword-usage](ptr-restrict-keyword-usage.md) - General guidance on when to apply `restrict`
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirm the loop is actually hot before optimizing it
