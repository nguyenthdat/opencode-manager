# ub-signed-integer-overflow

> Never let a signed integer computation overflow; use unsigned types, wider types, or overflow-checked arithmetic instead

## Why It Matters

Overflowing a signed integer (exceeding `INT_MAX` or going below `INT_MIN`) is undefined behavior in C — unlike unsigned overflow, which wraps modulo 2^n by definition. Compilers actively exploit this: they may assume `x + 1 > x` always holds for signed `x` and optimize away the overflow check you intended to write.

## Bad

```c
int add(int a, int b) {
    int sum = a + b;         /* UB if it overflows INT_MAX/INT_MIN */
    if (sum < a) {             /* compiler may optimize this check away entirely,
                                 * since signed overflow is "impossible" per the standard */
        return -1;
    }
    return sum;
}
```

## Good

```c
#include <limits.h>
#include <stdbool.h>

bool add_overflows(int a, int b, int *result) {
    if ((b > 0 && a > INT_MAX - b) || (b < 0 && a < INT_MIN - b)) {
        return true;    /* would overflow */
    }
    *result = a + b;
    return false;
}

/* C23 / GCC & Clang builtins do this correctly and efficiently: */
int result;
if (__builtin_add_overflow(a, b, &result)) {
    return -1;   /* overflow detected without UB */
}
```

## Prefer Unsigned for Sizes/Counts, But Watch Unsigned Wraparound Bugs Too

```c
/* Unsigned arithmetic wraps, which is well-defined but can still be a logic bug: */
size_t remaining = total - used;   /* if used > total, wraps to a huge number, not negative */
if (used > total) {
    remaining = 0;   /* check explicitly rather than relying on the wrap */
} else {
    remaining = total - used;
}
```

## See Also

- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Choosing the right integer width
- [ub-shift-by-invalid-amount](ub-shift-by-invalid-amount.md) - Another integer-related UB category
- [anti-mixing-signed-unsigned-compare](anti-mixing-signed-unsigned-compare.md) - Related comparison pitfalls
