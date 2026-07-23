# perf-const-for-optimizer

> Mark values `const` (and pointers-to-data `const`-qualified) wherever true, giving the optimizer more freedom to cache, reorder, and avoid redundant reloads

## Why It Matters

Beyond documentation and compile-time safety (see `type-const-correctness`), `const` also gives the optimizer additional guarantees to reason from: a `const`-qualified pointer parameter tells the compiler the pointee is not modified through that pointer within the function, which — combined with `restrict` and the absence of aliasing writes — can allow it to keep a value in a register instead of reloading it from memory on every access.

## Bad

```c
double sum_array(double *arr, size_t n) {   /* not const: compiler must consider that arr's
                                              * contents could change between reads within this function
                                              * if it can't otherwise prove they don't */
    double total = 0;
    for (size_t i = 0; i < n; i++) {
        total += arr[i];
    }
    return total;
}
```

## Good

```c
double sum_array(const double *restrict arr, size_t n) {
    double total = 0;
    for (size_t i = 0; i < n; i++) {
        total += arr[i];   /* const + restrict together give the optimizer maximum freedom
                             * to vectorize and avoid redundant memory traffic */
    }
    return total;
}
```

## const Alone Is a Modest Hint; Combine It With Other Signals for Real Gains

`const` by itself mostly documents intent and enables minor optimizations; the larger performance wins usually come from combining it with `restrict` (no aliasing) and confirming with `-O2`/`-O3` and profiling that the change actually mattered.

## See Also

- [type-const-correctness](type-const-correctness.md) - The primary, correctness-first motivation for `const`
- [perf-restrict-optimizer-hint](perf-restrict-optimizer-hint.md) - The complementary aliasing hint
- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Verifying any claimed optimization actually helps
