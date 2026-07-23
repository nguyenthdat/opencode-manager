# mem-struct-padding-awareness

> Be aware of compiler-inserted struct padding when reasoning about `sizeof`, serialization, or ABI

## Why It Matters

The compiler inserts padding bytes between struct members (and after the last member) to satisfy each member's alignment requirement. `sizeof(struct foo)` is therefore not simply the sum of its members' sizes, padding bytes have indeterminate content (a source of information leaks when structs are copied wholesale), and naive `memcpy`/network serialization of a struct is not portable across compilers or architectures.

## Bad

```c
struct event {
    char  kind;      /* 1 byte + 3 padding on common 32-bit-aligned targets */
    int   value;      /* 4 bytes */
    char  flag;       /* 1 byte + 3 padding */
};                     /* sizeof == 12, not 6 */

/* Sending the raw struct over the network/disk assumes a layout
 * that a different compiler/ABI is not obligated to produce. */
write(fd, &ev, sizeof(ev));
```

## Good

```c
/* Order members largest-to-smallest to minimize padding. */
struct event {
    int   value;      /* 4 bytes */
    char  kind;        /* 1 byte */
    char  flag;         /* 1 byte */
    /* 2 bytes trailing padding to align the struct itself, down from 6 */
};

/* For wire formats, serialize fields explicitly instead of memcpy'ing the struct: */
void event_encode(const struct event *e, unsigned char *out) {
    out[0] = (e->value >> 24) & 0xFF;
    out[1] = (e->value >> 16) & 0xFF;
    out[2] = (e->value >> 8) & 0xFF;
    out[3] = e->value & 0xFF;
    out[4] = (unsigned char)e->kind;
    out[5] = (unsigned char)e->flag;
}
```

## Verifying Layout

```c
static_assert(sizeof(struct event) == 8, "unexpected padding in struct event");
static_assert(offsetof(struct event, kind) == 4, "layout changed");
```

Use `__attribute__((packed))` (GCC/Clang) only when you specifically need a packed wire layout and understand the resulting unaligned-access cost; do not use it as a default.

## See Also

- [type-static-assert-invariants](type-static-assert-invariants.md) - Assert layout/size expectations at compile time
- [perf-cache-friendly-struct-layout](perf-cache-friendly-struct-layout.md) - Ordering members for cache performance
- [mem-sizeof-pointer-pitfall](mem-sizeof-pointer-pitfall.md) - Related `sizeof` pitfalls
