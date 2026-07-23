# ub-integer-division-by-zero

> Check the divisor before performing integer division or modulo; division by zero is undefined behavior for integers

## Why It Matters

Unlike IEEE 754 floating-point division (where `1.0 / 0.0` yields a well-defined `inf`), integer division by zero has no defined result in C. On most platforms it raises a hardware trap (SIGFPE) and terminates the process; on others it may produce an arbitrary value. `INT_MIN / -1` is a second, less obvious case of undefined behavior — it overflows the representable range.

## Bad

```c
int average(int total, int count) {
    return total / count;   /* crashes (or worse) if count == 0 */
}

int negate_divide(int x) {
    return x / -1;            /* UB if x == INT_MIN: result doesn't fit in int */
}
```

## Good

```c
#include <limits.h>

int average(int total, int count, int *out) {
    if (count == 0) {
        return -EINVAL;
    }
    *out = total / count;
    return 0;
}

int safe_negate_divide(int x, int divisor, int *out) {
    if (divisor == 0) return -EINVAL;
    if (x == INT_MIN && divisor == -1) return -ERANGE;  /* would overflow */
    *out = x / divisor;
    return 0;
}
```

## Modulo Has the Same Requirement

```c
int mod_safe(int a, int b, int *out) {
    if (b == 0) return -EINVAL;
    *out = a % b;   /* also UB when b == 0; same check covers both operators */
    return 0;
}
```

## See Also

- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - The related `INT_MIN / -1` overflow case
- [err-check-return-values](err-check-return-values.md) - General input-validation discipline
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - Catches division-by-zero and this overflow case at runtime
