# anti-comparing-floats-equality

> Don't compare floating-point values with `==`/`!=`; compare against an epsilon-bounded difference (or, for exact cases, use integer/fixed-point representations)

## Why It Matters

IEEE 754 floating-point arithmetic accumulates rounding error at nearly every operation, so two computations that are mathematically equal often produce bit-patterns that differ in their least significant bits. Direct equality comparison treats these as different values, causing conditions that "should" be true to silently evaluate false.

## Bad

```c
double result = 0.1 + 0.2;
if (result == 0.3) {   /* false! 0.1 + 0.2 == 0.30000000000000004 in IEEE 754 double precision */
    printf("equal\n");
}
```

## Good

```c
#include <math.h>

bool double_nearly_equal(double a, double b, double epsilon) {
    return fabs(a - b) <= epsilon * fmax(fabs(a), fmax(fabs(b), 1.0));
}

double result = 0.1 + 0.2;
if (double_nearly_equal(result, 0.3, 1e-9)) {
    printf("nearly equal\n");
}
```

## Special Cases That Genuinely Need Exact Comparison

```c
/* Comparing against exactly-representable values (0.0, 1.0, powers of 2 in
 * range) that were produced without intervening arithmetic can be exact: */
if (x == 0.0) { ... }   /* fine: no rounding error possible if x was set directly to 0.0 */

/* For money or other values needing exact arithmetic, avoid floating point
 * entirely: represent as integer cents/fixed-point instead. */
int64_t price_cents = 1999;   /* $19.99, exact, no float comparison issues at all */
```

## See Also

- [type-fixed-width-stdint](type-fixed-width-stdint.md) - Integer types for exact-arithmetic use cases
- [test-boundary-value-testing](test-boundary-value-testing.md) - Testing near-boundary floating-point behavior explicitly
- [anti-mixing-signed-unsigned-compare](anti-mixing-signed-unsigned-compare.md) - Another comparison-correctness pitfall
