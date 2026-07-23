# name-struct-typedef-convention

> Pick one consistent convention for naming structs and their typedefs, and apply it project-wide: either `typedef struct foo foo;` or a distinguishing suffix, never both styles mixed

## Why It Matters

C lets you refer to a struct as `struct foo` or, via a typedef, as a bare `foo`. Different codebases have different conventions (bare-name typedefs like the C standard library's `FILE`, or a `_t` suffix like POSIX's `pthread_t`, or no typedef at all, always spelling out `struct foo` like the Linux kernel). Mixing styles within one project makes it unclear, at a glance, whether a given name is a typedef or requires the `struct` keyword.

## Bad

```c
typedef struct widget widget;         /* style A: bare name */
struct connection { ... };              /* style B: always `struct connection`, no typedef */
typedef struct Logger_s Logger_t;        /* style C: `_t` suffix and a `_s` suffix on the tag */
/* three different conventions in one project */
```

## Good — Pick One, e.g. Bare-Name Opaque Typedefs for Public Types

```c
/* widget.h */
typedef struct widget widget;   /* consistent across every public type in this library */

widget *widget_create(void);

/* connection.h */
typedef struct connection connection;

connection *conn_open(const char *host);
```

## Good — Or Linux-Kernel Style: No Typedefs for Structs At All

```c
/* Always explicit `struct foo`, reserving typedefs only for things that are
 * genuinely not structs (function pointers, small scalar wrappers): */
struct widget *widget_create(void);
void widget_destroy(struct widget *w);
```

## Reserve `_t` Suffix for POSIX/Compiler-Provided Types

The POSIX standard reserves the `_t` suffix for its own type names in the implementation's namespace; using it heavily for your own types risks (rare but real) collisions and can also be confused for a system type by readers.

## See Also

- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - Where this convention is applied most visibly
- [name-avoid-reserved-identifiers](name-avoid-reserved-identifiers.md) - Reserved suffixes/prefixes to avoid
- [name-snake-case-functions](name-snake-case-functions.md) - The complementary function-naming convention
