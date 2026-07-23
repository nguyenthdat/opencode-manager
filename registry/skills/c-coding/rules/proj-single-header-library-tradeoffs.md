# proj-single-header-library-tradeoffs

> Use the single-header-library pattern (`STB_IMPLEMENTATION`-style) deliberately, understanding its build-time and compile-time trade-offs, rather than as a default distribution format

## Why It Matters

Single-header libraries (popularized by the stb libraries) ship declarations and implementation in one `.h` file, guarded so the implementation is only compiled once per binary via a defined macro. This drastically simplifies integration (drop one file into a project, no build-system changes) at the cost of slower compilation (the implementation is reparsed by the preprocessor in every including translation unit, even though only compiled once) and less separation between interface and implementation.

## Bad — Treating It as a Default for Any Library

```c
/* A large, actively-developed internal library distributed as a single
 * 10,000-line header "because it's simpler" — every translation unit that
 * includes it now reparses the entire implementation, slowing full rebuilds
 * significantly, for no integration benefit since it's already in-tree. */
```

## Good — Applied Where the Trade-off Actually Pays Off

```c
/* mylib.h */
#ifndef MYLIB_H
#define MYLIB_H

/* --- Public API declarations, always visible --- */
int mylib_process(const char *input);

#ifdef MYLIB_IMPLEMENTATION
/* --- Implementation, compiled only where this macro is defined --- */
int mylib_process(const char *input) {
    /* ... */
}
#endif /* MYLIB_IMPLEMENTATION */

#endif /* MYLIB_H */
```

```c
/* Exactly one translation unit defines the implementation macro: */
#define MYLIB_IMPLEMENTATION
#include "mylib.h"
```

## When This Pattern Is a Good Fit

Small, stable, rarely-modified utility libraries meant for easy vendoring into many unrelated projects (a JSON parser, an image loader) are the classic good fit — not a project's own actively-changing internal modules, which are better served by a normal header/source split.

## See Also

- [proj-header-source-split](proj-header-source-split.md) - The conventional alternative this pattern departs from
- [name-header-guard-naming](name-header-guard-naming.md) - Include-guard discipline this pattern still needs
- [proj-build-system-cmake-makefile](proj-build-system-cmake-makefile.md) - Normal build-system integration this pattern sidesteps
