# perf-inline-small-functions

> Mark small, frequently-called functions `static inline` (typically in a header) to let the compiler eliminate call overhead, and let the compiler override you when it disagrees

## Why It Matters

A function call has real overhead — pushing arguments, jumping, returning — that can dominate the cost of a genuinely tiny function (a getter, a simple bit-twiddle, a bounds check) called millions of times in a hot loop. `inline` is a *hint*, not a mandate; the compiler is free to ignore it (and usually does, correctly, for anything non-trivial), which makes it a safe suggestion rather than a forced optimization.

## Bad

```c
/* widget.c */
int widget_id(const struct widget *w) {   /* ordinary external function: real call overhead per invocation */
    return w->id;
}
/* Called in a hot loop thousands of times per frame, each time paying full call cost. */
```

## Good

```c
/* widget.h */
static inline int widget_id(const struct widget *w) {
    return w->id;   /* trivial accessor: an excellent inlining candidate */
}
```

## static inline in Headers Avoids Multiple-Definition Errors

```c
/* `static inline` in a header is safe to include in multiple translation
 * units: each gets its own internal-linkage copy, and the compiler is free
 * to inline call sites or emit the copy, without a linker symbol clash. */
```

## Don't Force It Reflexively

```c
/* Marking a large, complex function inline rarely helps (call overhead is
 * negligible relative to its body) and can hurt: excessive inlining bloats
 * code size, which itself hurts instruction-cache performance. */
static inline void complex_parse_and_validate(...)   /* likely a poor inlining candidate */
```

## See Also

- [perf-profile-before-optimize](perf-profile-before-optimize.md) - Confirm the call overhead is actually significant first
- [perf-branch-prediction-hints](perf-branch-prediction-hints.md) - Another compiler-hint-based micro-optimization
- [proj-single-header-library-tradeoffs](proj-single-header-library-tradeoffs.md) - Related header-only distribution pattern
