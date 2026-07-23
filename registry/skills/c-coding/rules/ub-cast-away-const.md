# ub-cast-away-const

> Never cast away `const` and then write through the resulting pointer

## Why It Matters

C allows the cast (`(char *)some_const_ptr`) to compile, but if the object the pointer actually refers to was originally declared `const`, writing through the cast pointer is undefined behavior. This differs subtly from writing through a non-`const` pointer to data that only happens to be treated as read-only by convention — the standard specifically calls out modifying a `const`-qualified object as UB.

## Bad

```c
void process(const struct config *cfg) {
    struct config *mutable_cfg = (struct config *)cfg;   /* casts away const */
    mutable_cfg->retries = 5;    /* UB if the underlying object is actually const */
}

const int limit = 100;
int *p = (int *)&limit;
*p = 200;                          /* definitely UB: limit is a genuinely const object */
```

## Good

```c
/* If the function needs to modify the config, its signature should say so honestly: */
void process(struct config *cfg) {
    cfg->retries = 5;
}

/* If a caller happens to have a non-const object but is calling through a
 * const-qualified API, casting away const to call a *non-mutating* legacy
 * API (which just failed to mark its parameter const) is fine as long as the
 * underlying object genuinely isn't const and the callee truly doesn't write: */
void legacy_read_only_api(char *buf);   /* poorly typed, but doesn't write */
const char *data = get_buffer();   /* known non-const at its point of origin */
legacy_read_only_api((char *)data);  /* acceptable only because it's read-only in practice and buffer wasn't declared const */
```

## Prefer Fixing the Signature Over Casting

The safest fix is almost always to correct the function signature (`const`-qualify parameters that are read-only; leave off `const` for ones that legitimately mutate) rather than reaching for a cast at the call site.

## See Also

- [ptr-const-correct-params](ptr-const-correct-params.md) - Getting the signature right in the first place
- [type-const-correctness](type-const-correctness.md) - Broader `const` discipline
- [ub-strict-aliasing-rule](ub-strict-aliasing-rule.md) - Another pointer-cast-related UB category
