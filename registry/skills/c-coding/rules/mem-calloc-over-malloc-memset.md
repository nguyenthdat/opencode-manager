# mem-calloc-over-malloc-memset

> Use `calloc()` when you need zeroed memory, not `malloc()` + `memset()`

## Why It Matters

`calloc(nmemb, size)` both allocates and zero-initializes, and it checks `nmemb * size` for overflow internally — something a manual `malloc(n * size)` does not do. It can also be faster: the OS can hand out already-zeroed pages (e.g. from `mmap`) without your program touching every byte.

## Bad

```c
size_t count = get_count();  /* attacker/user controlled */
struct item *items = malloc(count * sizeof(struct item));  /* overflow risk */
memset(items, 0, count * sizeof(struct item));
```

## Good

```c
size_t count = get_count();
struct item *items = calloc(count, sizeof(struct item));
if (!items) {
    return NULL;  /* calloc also detects count * sizeof overflow and fails safely */
}
```

## When memset Is Still Needed

```c
/* Zeroing a sub-range of an existing allocation still needs memset. */
struct item *items = malloc(count * sizeof(struct item));
if (!items) return NULL;
memset(items, 0, count * sizeof(struct item));  /* fine if you already checked overflow */

/* Zeroing a stack struct: */
struct config cfg;
memset(&cfg, 0, sizeof(cfg));
/* or, preferred in C99+: */
struct config cfg2 = {0};
```

## See Also

- [mem-check-malloc-failure](mem-check-malloc-failure.md) - Always check the result
- [type-struct-designated-init](type-struct-designated-init.md) - `= {0}` zero-initialization for structs
- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Overflow risk in manual size arithmetic
