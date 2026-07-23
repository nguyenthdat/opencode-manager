# type-struct-designated-init

> Use C99 designated initializers to initialize structs by field name, rather than positional initialization

## Why It Matters

Positional struct initialization (`struct point p = {1, 2, 3};`) silently breaks if a field is inserted, removed, or reordered — every positional initializer in the codebase now assigns the wrong values to the wrong fields, with no compiler error. Designated initializers name each field explicitly, so they remain correct across reordering and make the intended value-to-field mapping obvious to a reader without cross-referencing the struct definition.

## Bad

```c
struct config {
    int timeout_ms;
    int retries;
    bool verbose;
};

struct config cfg = { 3000, 5, true };   /* which field is which? must check the struct definition to be sure */

/* If a field is inserted later... */
struct config {
    int timeout_ms;
    int max_connections;   /* inserted */
    int retries;
    bool verbose;
};
struct config cfg2 = { 3000, 5, true };   /* now silently wrong: 5 goes to max_connections, true to retries */
```

## Good

```c
struct config cfg = {
    .timeout_ms = 3000,
    .retries = 5,
    .verbose = true,
};   /* immune to field reordering/insertion; unspecified fields are zero-initialized */
```

## Designated Initializers for Arrays Too

```c
int lookup[10] = {
    [0] = 1,
    [5] = 100,
    [9] = -1,
};   /* all other elements are implicitly zero */

const char *color_names[] = {
    [RED]   = "red",
    [GREEN] = "green",
    [BLUE]  = "blue",
};   /* index-by-enum-value, self-documenting */
```

## See Also

- [mem-init-before-use](mem-init-before-use.md) - Broader initialization discipline
- [ub-indeterminate-padding-bits](ub-indeterminate-padding-bits.md) - Why unspecified fields being zeroed still leaves padding indeterminate
- [type-static-assert-invariants](type-static-assert-invariants.md) - Verifying struct shape assumptions at compile time
