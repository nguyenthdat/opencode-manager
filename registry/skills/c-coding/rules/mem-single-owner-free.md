# mem-single-owner-free

> Establish one clear owner responsible for freeing each allocation

## Why It Matters

C has no destructor or borrow checker to enforce it, so ownership of heap memory is a *convention* the whole codebase must agree on. Without a documented, single owner, two pieces of code can each assume the other will free (a leak) or both free (a double free).

## Bad

```c
/* Unclear: does the caller or the callee own the returned buffer? */
char *format_name(const char *first, const char *last) {
    char *buf = malloc(256);
    snprintf(buf, 256, "%s %s", first, last);
    return buf;
}

void caller(void) {
    char *name = format_name("Ada", "Lovelace");
    printf("%s\n", name);
    /* Leaked: nothing in the API told the caller they must free() this. */
}
```

## Good

```c
/* Document ownership transfer explicitly in the header/comment. */

/* Returns a heap-allocated string; caller owns it and must free() it. */
char *format_name(const char *first, const char *last) {
    char *buf = malloc(256);
    if (!buf) return NULL;
    snprintf(buf, 256, "%s %s", first, last);
    return buf;
}

void caller(void) {
    char *name = format_name("Ada", "Lovelace");
    if (name) {
        printf("%s\n", name);
        free(name);   /* ownership transferred, caller frees */
    }
}
```

## Ownership Patterns to Pick From

| Pattern | Rule |
|---------|------|
| Caller-owns | Function fills a caller-provided buffer; caller allocated and frees it |
| Callee-returns-owned | Function allocates and returns; caller must free (document with `_new`/`_create`) |
| Borrowed | Function only reads the pointer during the call; never frees, never stores it |
| Container-owns | A struct's `_destroy`/`_free` function frees everything the struct owns |

## See Also

- [mem-free-null-pointer](mem-free-null-pointer.md) - Prevent reuse after freeing
- [api-init-cleanup-pair](api-init-cleanup-pair.md) - Pair every `_create`/`_init` with a `_destroy`/`_free`
- [doc-document-ownership-lifetime](doc-document-ownership-lifetime.md) - Document ownership in comments
