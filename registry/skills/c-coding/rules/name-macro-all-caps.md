# name-macro-all-caps

> Name object-like and function-like macros in `ALL_CAPS_WITH_UNDERSCORES` to visually distinguish them from ordinary functions and variables

## Why It Matters

Macros are textually substituted before compilation and can have surprising behavior (no type checking, multiple evaluation of arguments, no scoping). `ALL_CAPS` naming is a long-standing, near-universal C convention that immediately warns a reader "this is a macro, read its definition before assuming it behaves like a function or constant."

## Bad

```c
#define max_retries 5              /* looks like a normal constant/variable */
#define square(x) ((x) * (x))       /* looks like a normal function, but isn't one */

int n = square(a + b);                /* if square weren't macro-cased, easy to forget: expands to ((a + b) * (a + b)) — fine here, but the naming should still warn you to check */
```

## Good

```c
#define MAX_RETRIES 5
#define SQUARE(x) ((x) * (x))

int n = SQUARE(a + b);   /* ALL_CAPS signals "this is a macro; check for evaluation-order/side-effect surprises" */
```

## Function-Like Macros: Parenthesize Everything

```c
#define SQUARE(x) ((x) * (x))     /* parenthesize the argument AND the whole expansion */
/* #define SQUARE(x) x * x  would break as SQUARE(a + b) -> a + b * a + b */

/* Side effects in macro arguments are evaluated multiple times: avoid them */
int i = 5;
int bad = SQUARE(i++);   /* expands to ((i++) * (i++)): undefined behavior (unsequenced side effects) */
```

## See Also

- [name-header-guard-naming](name-header-guard-naming.md) - `ALL_CAPS` convention applied to include guards
- [ub-sequence-point-violation](ub-sequence-point-violation.md) - The macro-argument-side-effect hazard shown above
- [anti-macro-abuse](anti-macro-abuse.md) - When to reach for a function/inline instead of a macro
