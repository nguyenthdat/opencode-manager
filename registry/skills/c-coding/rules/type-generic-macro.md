# type-generic-macro

> Use C11 `_Generic` to write type-safe, type-dispatching macros instead of unsafe function-like macros or void-pointer-based generic functions

## Why It Matters

Before `_Generic`, "generic" behavior in C either relied on preprocessor macros with no type checking, or `void *`-based functions that lose type safety entirely and require manual casts. `_Generic` lets a macro select an implementation based on the compile-time type of its argument, giving you type-checked dispatch without sacrificing C's static typing.

## Bad

```c
/* Separate, differently-named functions the caller must remember to pick correctly */
int   abs_int(int x);
long  abs_long(long x);
double abs_double(double x);

/* Or, a void*-based "generic" that loses all type safety */
void *generic_abs(void *x, size_t size);  /* caller must track type and size manually */
```

## Good

```c
#include <stdlib.h>
#include <math.h>

#define GENERIC_ABS(x) _Generic((x), \
    int:    abs_int,    \
    long:   abs_long,    \
    double: abs_double)(x)

int    abs_int(int x)    { return x < 0 ? -x : x; }
long   abs_long(long x)  { return x < 0 ? -x : x; }
double abs_double(double x) { return fabs(x); }

int    a = GENERIC_ABS(-5);      /* dispatches to abs_int at compile time */
double b = GENERIC_ABS(-3.14);    /* dispatches to abs_double, still type-checked */
```

## Real-World Use: A Type-Generic Print Helper

```c
#define PRINT(x) _Generic((x),      \
    int:         print_int,          \
    long:        print_long,          \
    double:      print_double,         \
    const char*: print_string)(x)
```

## See Also

- [type-static-assert-invariants](type-static-assert-invariants.md) - Another C11 compile-time-checking feature
- [ptr-function-pointer-typedef](ptr-function-pointer-typedef.md) - Typedef discipline that keeps `_Generic` tables readable
- [ub-invalid-function-pointer-cast](ub-invalid-function-pointer-cast.md) - The unsafe alternative `_Generic` helps you avoid
