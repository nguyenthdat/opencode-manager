# anti-casting-malloc-return

> Don't cast the return value of `malloc`/`calloc`/`realloc` in C; it's unnecessary and can mask a missing `#include <stdlib.h>`

## Why It Matters

In C (unlike C++), `void *` converts implicitly to any object pointer type, so casting `malloc`'s return is never required. Worse, adding the cast can silence a genuinely useful compiler diagnostic: if `<stdlib.h>` isn't included, a pre-C99-style implicit `int` return type would otherwise trigger a warning/error about an incompatible implicit conversion — a cast suppresses exactly the safety net that would have caught the missing include.

## Bad

```c
/* Missing #include <stdlib.h> */
int *arr = (int *)malloc(10 * sizeof(int));   /* cast quietly papers over a missing declaration */
```

## Good

```c
#include <stdlib.h>

int *arr = malloc(10 * sizeof(*arr));   /* no cast needed; void* converts implicitly in C */
if (!arr) {
    return -ENOMEM;
}
```

## Where This Habit Comes From

The cast is a holdover from pre-ANSI C (where `malloc` wasn't reliably declared to return `void *`) or from C++ conventions (where the cast is genuinely required, since C++ does not allow implicit `void*`-to-`T*` conversion). Neither justification applies to modern, standard-conforming C.

## See Also

- [type-avoid-implicit-int](type-avoid-implicit-int.md) - The missing-declaration hazard this cast can mask
- [ptr-explicit-void-cast](ptr-explicit-void-cast.md) - When an explicit `void*` cast genuinely is warranted elsewhere
- [mem-check-malloc-failure](mem-check-malloc-failure.md) - The check that actually matters after allocating
