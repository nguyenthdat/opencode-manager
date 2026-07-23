# name-header-guard-naming

> Name include guards after the full relative header path in `ALL_CAPS_WITH_UNDERSCORES`, so guard names never collide across a project

## Why It Matters

Include guards prevent a header from being processed twice in one translation unit, but the guard macro itself lives in the same flat, project-wide namespace as every other macro. A generic guard name like `HEADER_H` will collide the moment two different directories both have a header that used it, silently suppressing the second header's contents.

## Bad

```c
/* src/net/socket.h */
#ifndef SOCKET_H
#define SOCKET_H
...
#endif

/* third_party/lib/socket.h — same guard name, different file */
#ifndef SOCKET_H          /* already defined by the other socket.h: this header's contents are skipped! */
#define SOCKET_H
...
#endif
```

## Good

```c
/* src/net/socket.h */
#ifndef MYPROJECT_NET_SOCKET_H
#define MYPROJECT_NET_SOCKET_H
...
#endif /* MYPROJECT_NET_SOCKET_H */

/* third_party/lib/socket.h keeps its own vendored guard name and doesn't collide */
```

## #pragma once as a Practical Supplement

```c
#pragma once   /* supported by all mainstream compilers (GCC, Clang, MSVC); not standard C but widely relied upon */

#ifndef MYPROJECT_NET_SOCKET_H   /* still include the portable guard as a fallback / for strict-standard builds */
#define MYPROJECT_NET_SOCKET_H
...
#endif
```

## See Also

- [name-macro-all-caps](name-macro-all-caps.md) - The casing convention this rule follows
- [proj-avoid-circular-includes](proj-avoid-circular-includes.md) - Related header-hygiene concern
- [api-header-c-linkage-guard](api-header-c-linkage-guard.md) - Another header-wide guard pattern
