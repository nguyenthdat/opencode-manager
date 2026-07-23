# mem-no-double-free

> Never free the same pointer twice

## Why It Matters

Calling `free()` twice on the same live allocation is undefined behavior. It commonly corrupts the allocator's internal bookkeeping (heap metadata), which can be exploited as a security vulnerability (double-free is a classic exploitation primitive) and often crashes far away from the actual bug.

## Bad

```c
void cleanup(struct conn *c) {
    free(c->buffer);
    if (c->error) {
        free(c->buffer);  /* double free if error path re-runs cleanup */
    }
}

/* Two owners think they're responsible */
void close_conn(struct conn *c) {
    free(c->buffer);
}
void on_error(struct conn *c) {
    close_conn(c);
    free(c->buffer);  /* already freed above */
}
```

## Good

```c
void cleanup(struct conn *c) {
    free(c->buffer);
    c->buffer = NULL;   /* free(NULL) is a safe no-op */
    if (c->error) {
        free(c->buffer);  /* now a no-op, not a double free */
    }
}
```

## Detecting Double Frees

```c
/* Build with sanitizers during development and CI: */
/* clang/gcc: -fsanitize=address  */
/* AddressSanitizer aborts immediately with a precise double-free report,
 * including both free() call stacks. */
```

## See Also

- [mem-free-null-pointer](mem-free-null-pointer.md) - Nulling pointers after free makes double free a no-op
- [mem-single-owner-free](mem-single-owner-free.md) - One clear owner avoids competing frees
- [lint-address-sanitizer](lint-address-sanitizer.md) - Catch double frees automatically in testing
