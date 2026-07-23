# perf-branch-prediction-hints

> Use `__builtin_expect` (or C++20/C23-style `[[likely]]`/`[[unlikely]]` attributes where available) to hint rare error branches to the compiler, only after profiling shows it matters

## Why It Matters

Modern CPUs speculatively execute past a branch based on prediction; a correctly predicted branch is essentially free, while a mispredicted one flushes the pipeline and costs real cycles. Hinting that an error-checking branch is rarely taken can help the compiler lay out code so the common (non-error) path stays contiguous and predictable — but the hardware branch predictor usually learns this on its own after a few iterations, so this is a micro-optimization for genuinely hot, measured code, not a default habit.

## Bad

```c
/* Sprinkling hints everywhere, including on branches that were never
 * measured to be hot or have any particular skew: */
if (__builtin_expect(x > 0, 1)) {  /* unverified guess, adds noise for no measured benefit */
    normal_path();
}
```

## Good

```c
#define LIKELY(x)   __builtin_expect(!!(x), 1)
#define UNLIKELY(x) __builtin_expect(!!(x), 0)

int process(struct request *req) {
    if (UNLIKELY(req == NULL)) {      /* error path: rare by construction, and this loop is measured hot */
        return -EINVAL;
    }
    return handle(req);                  /* keeps the common path's code contiguous */
}
```

## C23 Standard Attributes

```c
if (req == NULL) [[unlikely]] {
    return -EINVAL;
}
```

## Measure Before and After

```sh
perf stat -e branch-misses,branches ./bench_binary   # confirm mispredictions were actually a bottleneck,
                                                        # and that the hint measurably reduced them
```

## See Also

- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Required first step before adding any such hint
- [perf-inline-small-functions](perf-inline-small-functions.md) - Another compiler-hint-based micro-optimization
- [err-fail-fast-invariant](err-fail-fast-invariant.md) - The kind of rare error branch these hints often annotate
