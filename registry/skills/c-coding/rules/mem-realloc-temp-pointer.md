# mem-realloc-temp-pointer

> Assign `realloc()`'s result to a temporary pointer, never overwrite the original in place

## Why It Matters

`realloc()` returns `NULL` on failure but leaves the original allocation untouched and still valid. If you assign the result directly back onto the only pointer that references it, a failed `realloc` overwrites your last reference with `NULL` and leaks the original block.

## Bad

```c
void grow(char **buf, size_t new_size) {
    *buf = realloc(*buf, new_size);   /* leaks old block if realloc fails */
    /* *buf is now NULL, and the original allocation is unreachable */
}
```

## Good

```c
int grow(char **buf, size_t new_size) {
    char *tmp = realloc(*buf, new_size);
    if (!tmp) {
        return -1;          /* *buf is still valid; caller can free it or retry */
    }
    *buf = tmp;
    return 0;
}
```

## Growable Buffer Pattern

```c
struct dynbuf {
    char  *data;
    size_t len;
    size_t cap;
};

int dynbuf_reserve(struct dynbuf *b, size_t extra) {
    if (b->len + extra <= b->cap) return 0;
    size_t new_cap = b->cap ? b->cap * 2 : 16;
    while (new_cap < b->len + extra) new_cap *= 2;

    char *tmp = realloc(b->data, new_cap);
    if (!tmp) return -1;     /* b->data untouched on failure */
    b->data = tmp;
    b->cap = new_cap;
    return 0;
}
```

## See Also

- [mem-check-malloc-failure](mem-check-malloc-failure.md) - General allocation-failure checking
- [mem-free-list-pool](mem-free-list-pool.md) - Alternative to repeated realloc for fixed-size objects
- [perf-avoid-alloc-in-hot-loop](perf-avoid-alloc-in-hot-loop.md) - Amortized growth strategy
