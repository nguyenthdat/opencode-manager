# mem-check-malloc-failure

> Always check the return value of `malloc`/`calloc`/`realloc` for `NULL`

## Why It Matters

`malloc` and friends return `NULL` when the system cannot satisfy an allocation request. Dereferencing that `NULL` pointer is undefined behavior and typically crashes the process, but on some embedded or memory-constrained systems allocation failure is routine and must be handled gracefully rather than crashing.

## Bad

```c
struct user *u = malloc(sizeof(struct user));
u->id = 42;  /* crashes if malloc returned NULL */

char *buf = malloc(len);
memcpy(buf, src, len);  /* undefined behavior on NULL */
```

## Good

```c
struct user *u = malloc(sizeof(struct user));
if (u == NULL) {
    fprintf(stderr, "out of memory allocating user\n");
    return NULL;
}
u->id = 42;

char *buf = malloc(len);
if (!buf) {
    return -ENOMEM;
}
memcpy(buf, src, len);
```

## When a Missing Check Is Acceptable

```c
/* Short-lived CLI tools that should abort immediately on OOM can use a
 * checked wrapper instead of checking every call site. */
static void *xmalloc(size_t size) {
    void *p = malloc(size);
    if (!p) {
        fprintf(stderr, "fatal: out of memory\n");
        abort();
    }
    return p;
}
```

## See Also

- [mem-realloc-temp-pointer](mem-realloc-temp-pointer.md) - Avoid leaking on `realloc` failure
- [err-check-return-values](err-check-return-values.md) - General return-value checking discipline
- [anti-unchecked-malloc](anti-unchecked-malloc.md) - Anti-pattern reference
