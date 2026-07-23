# proj-avoid-circular-includes

> Never let two headers `#include` each other directly or indirectly; break the cycle with forward declarations or by extracting shared types into a third header

## Why It Matters

A circular include (`a.h` includes `b.h`, which includes `a.h`) relies entirely on include guards to avoid infinite recursion, but the result is fragile: whichever header happens to be included first sees a partially-processed version of the other, which frequently leads to "unknown type" or "redefinition" errors that appear or disappear depending on include order — a maintenance trap that gets worse as a project grows.

## Bad

```c
/* a.h */
#ifndef A_H
#define A_H
#include "b.h"
struct a { struct b *link; };
#endif

/* b.h */
#ifndef B_H
#define B_H
#include "a.h"     /* circular: a.h -> b.h -> a.h */
struct b { struct a *link; };
#endif
```

## Good — Forward Declaration Breaks the Cycle

```c
/* a.h */
#ifndef A_H
#define A_H
struct b;   /* forward declaration: no need to see b's full definition here */
struct a { struct b *link; };
#endif

/* b.h */
#ifndef B_H
#define B_H
struct a;
struct b { struct a *link; };
#endif
```

## Good — Or Extract the Shared Type Into a Third Header

```c
/* types.h */
struct a; struct b;

/* a.h includes types.h and b.h if it needs b's full definition (not just a pointer) */
/* b.h includes types.h similarly; neither includes the other directly */
```

## See Also

- [name-header-guard-naming](name-header-guard-naming.md) - Include guards, which mask but don't fix this problem
- [proj-include-what-you-use](proj-include-what-you-use.md) - Related include-hygiene discipline
- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - Forward declarations are central to this pattern too
