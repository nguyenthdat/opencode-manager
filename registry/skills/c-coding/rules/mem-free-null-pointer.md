# mem-free-null-pointer

> Set pointers to `NULL` immediately after `free()` to prevent accidental reuse

## Why It Matters

After `free()`, a pointer becomes a "dangling pointer" — the memory may be reused by the allocator, but the variable still holds its old address. Any later use (deref, or a second `free`) is undefined behavior. Setting the pointer to `NULL` makes accidental reuse a safe, detectable no-op instead of silent corruption.

## Bad

```c
void release(struct node *n) {
    free(n);
    /* n still points at freed memory */
}

void use_after(struct node *n) {
    release(n);
    printf("%d\n", n->value);  /* use-after-free */
}
```

## Good

```c
void release(struct node **n) {
    free(*n);
    *n = NULL;
}

void use_after(struct node *n) {
    release(&n);
    if (n != NULL) {
        printf("%d\n", n->value);
    }
    /* n is NULL here; free(NULL) is a safe no-op too */
}
```

## The free(NULL) Guarantee

```c
/* free() on NULL is always well-defined and does nothing, so this is safe: */
free(ptr);
ptr = NULL;
free(ptr);  /* no-op, not a double free */
```

## See Also

- [mem-no-double-free](mem-no-double-free.md) - Never free the same live allocation twice
- [mem-no-use-after-free](mem-no-use-after-free.md) - Never touch memory after it is freed
- [mem-single-owner-free](mem-single-owner-free.md) - Establish a clear owner for each allocation
