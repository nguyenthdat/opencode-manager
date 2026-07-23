# anti-macro-abuse

> Don't use function-like macros where a `static inline` function would be equally efficient and type-safe

## Why It Matters

Macros are textual substitution with no type checking, no scoping, and multiple-evaluation hazards for arguments with side effects. `static inline` functions give the compiler's optimizer the same opportunity to eliminate call overhead, while adding real type checking, proper scoping, and single evaluation of arguments — with none of a macro's footguns.

## Bad

```c
#define MAX(a, b) ((a) > (b) ? (a) : (b))

int x = 5;
int y = MAX(x++, 10);   /* x incremented 0, 1, or 2 times depending on the branch taken: unsequenced, UB-adjacent */

#define SQUARE(x) x * x
int n = 100 / SQUARE(2 + 3);   /* expands to 100 / 2 + 3 * 2 + 3 = wildly wrong due to missing parens */
```

## Good

```c
static inline int max_int(int a, int b) {
    return (a > b) ? a : b;   /* arguments evaluated exactly once, fully type-checked */
}

static inline int square(int x) {
    return x * x;
}

int x = 5;
int y = max_int(x++, 10);   /* x incremented exactly once, well-defined */
```

## When a Macro Is Still the Right Tool

Macros remain appropriate for things a function fundamentally cannot do: token pasting, stringification, conditional compilation, and genuinely type-generic code before `_Generic` covers the case.

## See Also

- [type-generic-macro](type-generic-macro.md) - Where `_Generic` macros are the right tool
- [perf-inline-small-functions](perf-inline-small-functions.md) - The `static inline` alternative shown above
- [ub-sequence-point-violation](ub-sequence-point-violation.md) - The unsequenced-evaluation hazard this anti-pattern often causes
