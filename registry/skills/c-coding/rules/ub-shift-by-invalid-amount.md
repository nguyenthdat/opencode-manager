# ub-shift-by-invalid-amount

> Never shift a value by a negative amount or by an amount greater than or equal to its type's bit width

## Why It Matters

`x << n` and `x >> n` are undefined behavior in C when `n` is negative or `n >= (bit width of x's type)`. This is easy to trigger accidentally with a computed shift amount (e.g., derived from user input or a loop variable), and left-shifting a negative signed value, or one that overflows the result type, is separately undefined.

## Bad

```c
uint32_t mask_bits(uint32_t value, int bits) {
    return value << bits;    /* UB if bits < 0 or bits >= 32 */
}

int32_t x = -1;
int32_t y = x << 2;            /* left-shifting a negative signed value: UB */
```

## Good

```c
#include <stdint.h>

uint32_t mask_bits(uint32_t value, unsigned bits) {
    if (bits >= 32) {
        return 0;   /* define your own saturating behavior explicitly */
    }
    return value << bits;
}

/* Prefer unsigned types for bit manipulation to sidestep signed-shift UB entirely: */
uint32_t x = 0xFFFFFFFFu;
uint32_t y = x << 2;   /* well-defined: wraps per unsigned arithmetic rules */
```

## Bit-Width-Safe Helper

```c
static inline uint32_t safe_lshift32(uint32_t v, unsigned n) {
    return (n < 32) ? (v << n) : 0;
}
```

## See Also

- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Choosing unsigned fixed-width types for bit operations
- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Related signed-arithmetic UB
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - UBSan's `shift` check catches this at runtime
