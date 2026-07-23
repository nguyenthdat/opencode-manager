# type-avoid-implicit-int

> Always write an explicit return type and explicit parameter types; never rely on old, now-removed "implicit int" defaults

## Why It Matters

Pre-C99 C allowed omitting a function's return type (defaulting to `int`) and, in very old K&R-style code, even parameter types. C99 removed implicit-int entirely, and modern compilers reject or strongly warn on it — but legacy code, or code copied from old tutorials, can still contain these forms, and they signal a codebase that hasn't been updated to a modern standard, hiding real declaration mismatches behind a "works anyway" default.

## Bad

```c
main() {                 /* implicit int return type: not valid since C99 */
    return 0;
}

foo(x, y)                  /* K&R-style implicit parameter types: pre-ANSI C, not valid in modern C */
    int x, y;
{
    return x + y;
}

static compute(int x) {   /* implicit int return type on a static function */
    return x * 2;
}
```

## Good

```c
int main(void) {
    return 0;
}

int foo(int x, int y) {
    return x + y;
}

static int compute(int x) {
    return x * 2;
}
```

## Enforce With Compiler Flags

```sh
cc -std=c17 -Wall -Wextra -Wimplicit-int -Wimplicit-function-declaration -Werror file.c
```

Modern GCC/Clang reject implicit-int and implicit function declarations by default under `-std=c99` or later; keep these warnings as errors so any accidental old-style declaration fails the build immediately.

## See Also

- [err-check-return-values](err-check-return-values.md) - Explicit return types are a prerequisite for meaningful return-value checking
- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - The broader warning-flag policy this rule fits into
- [proj-build-system-cmake-makefile](proj-build-system-cmake-makefile.md) - Setting `-std=c17`/`-std=c23` project-wide
