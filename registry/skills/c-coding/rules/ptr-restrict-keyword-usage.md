# ptr-restrict-keyword-usage

> Use `restrict` on pointer parameters only when you can guarantee the pointed-to objects never overlap

## Why It Matters

`restrict` (C99) tells the compiler that, for the lifetime of the pointer, the referenced object is accessed only through that pointer (or ones derived from it) — no other pointer in scope aliases it. This lets the compiler skip reload/anti-aliasing safety code and vectorize more aggressively. Applying `restrict` to pointers that *can* alias is undefined behavior, so it's an optimization tool that also carries a correctness obligation.

## Bad

```c
/* Claims no overlap, but callers can (and do) pass overlapping buffers */
void add_vectors(double *restrict dst, const double *restrict a, const double *restrict b, size_t n) {
    for (size_t i = 0; i < n; i++) dst[i] = a[i] + b[i];
}

add_vectors(buf, buf, other, n);   /* dst aliases a: violates the restrict contract, UB */
```

## Good

```c
/* Document and enforce the no-overlap contract at the call sites that matter */
void add_vectors(double *restrict dst, const double *restrict a,
                  const double *restrict b, size_t n) {
    for (size_t i = 0; i < n; i++) dst[i] = a[i] + b[i];
}

double out[64], x[64], y[64];
add_vectors(out, x, y, 64);   /* distinct buffers: contract satisfied */

/* memcpy's standard signature is the canonical example: */
void *memcpy(void *restrict dst, const void *restrict src, size_t n);
/* which is exactly why overlapping ranges require memmove instead */
```

## When Not to Use restrict

Don't add `restrict` reflexively to every pointer parameter "for performance" — only apply it where you have verified (via API contract, tests, or assertions in debug builds) that aliasing truly cannot occur. An incorrect `restrict` is a silent correctness bug that only manifests under optimization.

## See Also

- [ub-restrict-correctness](ub-restrict-correctness.md) - The undefined-behavior consequences of misuse
- [perf-restrict-optimizer-hint](perf-restrict-optimizer-hint.md) - Performance motivation and measured impact
- [ub-strict-aliasing-rule](ub-strict-aliasing-rule.md) - Related aliasing rules
