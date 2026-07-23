# mem-init-before-use

> Initialize every variable before it is read; never rely on indeterminate values

## Why It Matters

Local variables and heap allocations (`malloc`, unlike `calloc`) start with indeterminate content. Reading an uninitialized variable is undefined behavior — the value can be garbage, can differ between optimization levels, and in the case of uninitialized pointers can point anywhere, turning a logic bug into memory corruption.

## Bad

```c
int compute(int flag) {
    int result;                 /* indeterminate */
    if (flag) {
        result = 42;
    }
    return result;               /* UB if flag was false */
}

struct point *p = malloc(sizeof(*p));
printf("%d\n", p->x);            /* p->x is indeterminate */
```

## Good

```c
int compute(int flag) {
    int result = 0;              /* explicit default */
    if (flag) {
        result = 42;
    }
    return result;
}

struct point *p = calloc(1, sizeof(*p));  /* zero-initialized */
if (p) {
    printf("%d\n", p->x);        /* well-defined: 0 */
}
```

## Struct and Array Initialization

```c
struct config cfg = {0};             /* zero-init every member, C99+ */
int scores[10] = {0};                /* all elements zeroed */
struct point pts[4] = { {0,0}, {1,0} };  /* remaining elements zeroed */
```

## Tooling

Compile with `-Wall -Wextra` (catches many "may be used uninitialized" cases) and run tests under MemorySanitizer or Valgrind's `--track-origins=yes`, which flag uninitialized reads that static analysis misses.

## See Also

- [mem-calloc-over-malloc-memset](mem-calloc-over-malloc-memset.md) - Zero-initialize on allocation
- [type-struct-designated-init](type-struct-designated-init.md) - Designated initializers for clarity
- [ub-uninitialized-variable-read](ub-uninitialized-variable-read.md) - The formal undefined-behavior rule
