# doc-document-ownership-lifetime

> Document, in the comment for every function that returns or accepts a pointer, exactly who owns the memory and how long it remains valid

## Why It Matters

The C type system cannot express ownership or lifetime — `char *` looks the same whether it's a fresh heap allocation the caller must free, a borrowed pointer into another object's internal storage, or a pointer valid only until the next call to the same API. Since the compiler can't enforce or even communicate this, a comment is the only place this critical contract can live, and omitting it is a direct cause of leaks and use-after-free bugs.

## Bad

```c
char *widget_describe(const widget *w);        /* caller frees this? for how long is it valid? */
const char *widget_last_error(void);              /* valid until when? overwritten by the next call? */
```

## Good

```c
/**
 * @return A newly heap-allocated description string. Caller owns it and
 *         must free() it. Valid independently of `w`'s lifetime.
 */
char *widget_describe(const widget *w);

/**
 * @return A pointer to a thread-local buffer holding the last error message
 *         set on this thread. Valid only until the next call to any widget_*
 *         function on this thread; do not free() it, do not retain it.
 */
const char *widget_last_error(void);
```

## Document Ownership for Struct Fields Too

```c
struct request {
    char *body;   /* Owned by this struct; freed by request_destroy(). Do not
                   * free it independently or hand it to another owner. */
};
```

## See Also

- [api-return-owned-vs-borrowed-doc](api-return-owned-vs-borrowed-doc.md) - The specific API-design rule this documents
- [mem-single-owner-free](mem-single-owner-free.md) - The ownership discipline being made explicit
- [doc-doxygen-function-comments](doc-doxygen-function-comments.md) - Where this documentation physically lives
