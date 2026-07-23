# api-return-owned-vs-borrowed-doc

> Document, for every function returning a pointer, whether the caller owns it (must free) or is only borrowing it (must not free, may not outlive the source)

## Why It Matters

A returned pointer's ownership is invisible in the C type system — `char *` looks identical whether it's a fresh heap allocation the caller must free, or a pointer into a struct's internal buffer that becomes invalid the moment the struct is destroyed. Without an explicit, per-function convention documented at the declaration, callers either leak owned memory or free (or retain past its lifetime) borrowed memory.

## Bad

```c
/* No indication of ownership: does the caller free this? for how long is it valid? */
char *widget_describe(const widget *w);
const char *widget_name(const widget *w);
```

## Good

```c
/** Returns a newly heap-allocated description string. Caller owns it and
 *  must free() it. Valid independently of `w`'s lifetime. */
char *widget_describe(const widget *w);

/** Returns a borrowed pointer into `w`'s internal storage. Do not free it,
 *  and do not use it after `w` is destroyed or renamed. */
const char *widget_name(const widget *w);
```

## Naming as a Lightweight Signal

```c
/* A `_new`/`_dup`/`_create`-style name often signals "you own this,"
 * complementing (never replacing) the explicit doc comment: */
char *widget_name_dup(const widget *w);    /* owned copy, caller frees */
const char *widget_name_ref(const widget *w);  /* borrowed reference */
```

## See Also

- [mem-single-owner-free](mem-single-owner-free.md) - The ownership discipline being documented here
- [doc-document-ownership-lifetime](doc-document-ownership-lifetime.md) - Broader guidance on documenting lifetimes
- [api-const-correct-signatures](api-const-correct-signatures.md) - `const` return types signal read-only/borrowed access
