# api-minimal-public-surface

> Expose the smallest possible set of public functions and types; make everything else `static` or move it to a private header

## Why It Matters

Every public symbol is a permanent commitment — removing or changing it later is a breaking change for every consumer. A minimal public surface is easier to document fully, easier to keep backward compatible, and easier for consumers to learn, while internal helper functions marked `static` can be freely refactored since nothing outside the translation unit can depend on them.

## Bad

```c
/* widget.c — everything is a non-static, implicitly public symbol */
int validate_name(const char *name) { ... }        /* internal helper, but linkable from anywhere */
int compute_hash(const char *name) { ... }           /* same */
widget *widget_create(const char *name) {
    if (!validate_name(name)) return NULL;
    ...
}
```

## Good

```c
/* widget.c */
static int validate_name(const char *name) { ... }   /* internal linkage: invisible outside this file */
static int compute_hash(const char *name) { ... }

widget *widget_create(const char *name) {              /* only this is exported */
    if (!validate_name(name)) return NULL;
    ...
}

/* widget.h — only the intended public API appears here at all */
widget *widget_create(const char *name);
void    widget_destroy(widget *w);
```

## Auditing Your Public Surface

```sh
# List every externally-visible (non-static) symbol in a compiled object,
# to spot accidental exports that should have been `static`:
nm -g --defined-only widget.o
```

## See Also

- [proj-pub-crate-internal](proj-public-vs-private-headers-dir.md) - Splitting public vs. private headers
- [name-static-file-scope-prefix](name-static-file-scope-prefix.md) - Naming conventions for internal-linkage symbols
- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - Hiding struct layout as part of a minimal surface
