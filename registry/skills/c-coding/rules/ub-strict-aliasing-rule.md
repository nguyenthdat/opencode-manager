# ub-strict-aliasing-rule

> Never access an object through a pointer of an incompatible type; the compiler is allowed to assume this never happens

## Why It Matters

The strict aliasing rule says an object may only be accessed through an lvalue of its own type (or a compatible/`char`-family type). Violating it — e.g., writing a `float` and reading it back as an `int` through a cast pointer — is undefined behavior. At higher optimization levels the compiler may reorder or cache loads/stores based on the assumption that differently-typed pointers never alias the same memory, producing results that look like miscompilation.

## Bad

```c
void scale(float *values, int n) {
    for (int i = 0; i < n; i++) {
        int *bits = (int *)&values[i];   /* reinterpret float storage as int */
        *bits &= 0x7FFFFFFF;                /* "clear sign bit" via int math: UB */
    }
}
```

## Good

```c
#include <string.h>

void scale(float *values, int n) {
    for (int i = 0; i < n; i++) {
        uint32_t bits;
        memcpy(&bits, &values[i], sizeof(bits));   /* well-defined reinterpretation */
        bits &= 0x7FFFFFFFu;
        memcpy(&values[i], &bits, sizeof(bits));
    }
}
```

## Compiler Flags That Reveal Violations

```sh
# -fstrict-aliasing is on by default at -O2+ on GCC/Clang; -Wstrict-aliasing
# helps flag some (not all) violations statically.
cc -O2 -Wall -Wextra -Wstrict-aliasing=2 -fsanitize=undefined file.c
```

`-fno-strict-aliasing` disables the optimization (and the UB risk) at a performance cost — useful as a stopgap for legacy code, not a substitute for fixing violations.

## See Also

- [ptr-type-punning-memcpy](ptr-type-punning-memcpy.md) - The safe alternative pattern
- [ub-cast-away-const](ub-cast-away-const.md) - Another pointer-cast-related UB category
- [lint-undefined-behavior-sanitizer](lint-undefined-behavior-sanitizer.md) - UBSan can catch some aliasing issues
