# type-avoid-implicit-narrowing

> Make narrowing conversions (wide type to narrow type, e.g. `long` to `int`) explicit, and check the value's range before converting when data loss would be a bug

## Why It Matters

C allows implicit narrowing conversions in assignments, function calls, and initializations, silently truncating or reinterpreting bits if the source value doesn't fit in the destination type. This is not undefined behavior for unsigned targets (well-defined modulo wraparound), but for signed targets outside the representable range it is implementation-defined behavior, and either way it is very often a real bug, not an intended truncation.

## Bad

```c
size_t len = get_length();     /* size_t, e.g. 64-bit */
int n = len;                       /* implicit narrowing: silently truncates if len > INT_MAX */

long timestamp = get_timestamp();
int32_t ts32 = timestamp;            /* silent truncation on 64-bit long platforms */
```

## Good

```c
#include <limits.h>

size_t len = get_length();
if (len > INT_MAX) {
    return -ERANGE;             /* explicit range check before converting */
}
int n = (int)len;                /* explicit cast documents the intended, now-safe conversion */

long timestamp = get_timestamp();
if (timestamp < INT32_MIN || timestamp > INT32_MAX) {
    return -ERANGE;
}
int32_t ts32 = (int32_t)timestamp;
```

## Compiler Warnings That Catch This

```sh
cc -Wall -Wextra -Wconversion -Wsign-conversion file.c
```

`-Wconversion` flags implicit narrowing and sign-changing conversions across the board — noisy on legacy code, but valuable to enable incrementally on new/refactored code.

## See Also

- [ub-signed-integer-overflow](ub-signed-integer-overflow.md) - Related signed-arithmetic hazards
- [anti-mixing-signed-unsigned-compare](anti-mixing-signed-unsigned-compare.md) - The comparison-side version of this issue
- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Choosing types whose width you can reason about precisely
