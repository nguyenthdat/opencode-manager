# api-opaque-struct-encapsulation

> Hide a struct's fields from consumers by exposing only a forward-declared (opaque) pointer type in the public header

## Why It Matters

C has no `private` keyword, so any struct fully defined in a public header exposes its layout to every consumer, who can then depend on field order, sizes, and direct access — turning any future internal change into a breaking API/ABI change. An opaque pointer type keeps the real definition in the `.c` file, so the internal layout can evolve freely as long as the public functions keep their signatures.

## Bad

```c
/* widget.h */
struct widget {
    int id;
    char name[64];
    struct widget_impl *impl;   /* consumers can poke at every field directly */
};

/* consumer.c */
struct widget w;
w.id = 5;                          /* now depends on the exact layout forever */
```

## Good

```c
/* widget.h */
typedef struct widget widget;   /* opaque: consumers only ever see a pointer */

widget *widget_create(const char *name);
void    widget_destroy(widget *w);
int     widget_id(const widget *w);
void    widget_set_name(widget *w, const char *name);

/* widget.c */
struct widget {                  /* real definition, private to this file */
    int id;
    char name[64];
    struct widget_impl *impl;
};

widget *widget_create(const char *name) {
    widget *w = calloc(1, sizeof(*w));
    if (w) strncpy(w->name, name, sizeof(w->name) - 1);
    return w;
}
```

## Trade-offs

Opaque structs require a heap allocation (consumers can't put a `widget` on their own stack, since its size is unknown to them) and every field access goes through a function call. This is the right trade for public library boundaries; for small, purely internal structs within one module, a plain visible struct is simpler and has no such cost.

## See Also

- [api-minimal-public-surface](api-minimal-public-surface.md) - The broader principle this technique serves
- [api-init-cleanup-pair](api-init-cleanup-pair.md) - Pairing `_create`/`_destroy` for opaque types
- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - Where the real definition lives
