# mem-sizeof-pointer-pitfall

> Use `sizeof(*ptr)` instead of `sizeof(type)` to keep allocation size in sync with the variable's actual type

## Why It Matters

`sizeof(SomeType)` silently keeps compiling even after the variable's declared type changes, allocating the wrong size. `sizeof(*ptr)` (or `sizeof(variable)`) always tracks the variable it is attached to, so a type change is automatically reflected and mismatches become a compile error instead of a silent under-allocation.

## Bad

```c
struct wide_record *rec = malloc(sizeof(struct record));  /* wrong type! */
/* Compiles fine even though `rec` is a `wide_record *` — classic copy/paste bug
 * when the struct name was refactored but not every malloc site was updated. */

int *counts = malloc(10 * sizeof(int));
/* Later `counts` becomes `long *` — this now under-allocates. */
```

## Good

```c
struct wide_record *rec = malloc(sizeof(*rec));   /* always matches rec's type */

long *counts = malloc(10 * sizeof(*counts));      /* tracks whatever type counts is */

/* Also applies to memset/memcpy sizes: */
memset(rec, 0, sizeof(*rec));
```

## Overflow-Safe Array Allocation

```c
size_t n = get_n();
/* Prefer calloc, which checks n * sizeof(*arr) for overflow: */
int *arr = calloc(n, sizeof(*arr));
if (!arr) return NULL;
```

## See Also

- [mem-calloc-over-malloc-memset](mem-calloc-over-malloc-memset.md) - Overflow-checked zeroed allocation
- [anti-sizeof-array-parameter](anti-sizeof-array-parameter.md) - `sizeof` on a decayed array parameter
- [mem-check-malloc-failure](mem-check-malloc-failure.md) - Always check the allocation result
