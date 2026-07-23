# ub-restrict-correctness

> Never mark a pointer parameter `restrict` if a caller can supply overlapping/aliased memory for it

## Why It Matters

`restrict` is a promise to the compiler, not a check. Once you write it, the compiler may reorder loads and stores, cache values in registers across calls, and vectorize the code on the assumption that no other pointer in scope refers to the same memory. If that promise is false, the miscompiled code performs a different computation than the source implies — undefined behavior that can be very hard to trace back to the `restrict` annotation.

## Bad

```c
void merge(int *restrict dst, const int *restrict src, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dst[i] += src[i];
    }
}

int buf[100];
merge(buf, buf + 1, 50);   /* overlapping ranges passed to a restrict-qualified function: UB */
```

## Good

```c
void merge(int *restrict dst, const int *restrict src, size_t n) {
    for (size_t i = 0; i < n; i++) {
        dst[i] += src[i];
    }
}

int a[100], b[100];
merge(a, b, 100);   /* genuinely distinct, non-overlapping buffers */

/* If overlap is possible, don't use restrict — or provide a memmove-style
 * function that explicitly handles the overlapping case: */
void merge_may_overlap(int *dst, const int *src, size_t n) {
    if (dst < src) {
        for (size_t i = 0; i < n; i++) dst[i] += src[i];
    } else {
        for (size_t i = n; i-- > 0; ) dst[i] += src[i];
    }
}
```

## Verifying the Contract in Debug Builds

```c
#ifndef NDEBUG
#define ASSERT_NO_OVERLAP(a, b, n) \
    assert(!ranges_overlap((a), (b), (n)))
#else
#define ASSERT_NO_OVERLAP(a, b, n)
#endif
```

## See Also

- [ptr-restrict-keyword-usage](ptr-restrict-keyword-usage.md) - When and how to apply `restrict` correctly
- [perf-restrict-optimizer-hint](perf-restrict-optimizer-hint.md) - The performance benefit that motivates its use
- [ub-strict-aliasing-rule](ub-strict-aliasing-rule.md) - Related aliasing-based optimization assumptions
