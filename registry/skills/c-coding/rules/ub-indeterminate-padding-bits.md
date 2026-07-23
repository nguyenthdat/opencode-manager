# ub-indeterminate-padding-bits

> Never rely on the contents of struct padding bytes, and zero them explicitly before comparing, hashing, or transmitting a struct

## Why It Matters

Padding bytes inserted by the compiler for alignment have indeterminate values — they are not guaranteed to be zero, even for a `static`-duration or `calloc`'d object in some edge cases involving later partial writes, and definitely not for a stack-allocated struct that was only partially initialized. Comparing two structs byte-for-byte with `memcmp`, hashing them, or writing them to disk/network can therefore produce inconsistent results even when every named field is logically equal.

## Bad

```c
struct point { char tag; int x, y; };   /* padding after `tag` */

struct point a = { .tag = 'A', .x = 1, .y = 2 };
struct point b = { .tag = 'A', .x = 1, .y = 2 };
if (memcmp(&a, &b, sizeof(a)) == 0) {   /* may spuriously differ: padding bytes are indeterminate */
    /* ... */
}
```

## Good

```c
struct point { char tag; int x, y; };

bool point_equal(const struct point *a, const struct point *b) {
    return a->tag == b->tag && a->x == b->x && a->y == b->y;   /* field-by-field, never touches padding */
}

/* If you must byte-compare/hash (e.g. as a hash-table key), zero the whole
 * struct first so padding is deterministic: */
struct point make_point(char tag, int x, int y) {
    struct point p;
    memset(&p, 0, sizeof(p));   /* padding now deterministically zero */
    p.tag = tag; p.x = x; p.y = y;
    return p;
}
```

## See Also

- [mem-struct-padding-awareness](mem-struct-padding-awareness.md) - Understanding where padding comes from
- [mem-init-before-use](mem-init-before-use.md) - Zero-initialization discipline
- [type-static-assert-invariants](type-static-assert-invariants.md) - Asserting layout assumptions at compile time
