# name-static-file-scope-prefix

> Adopt a lightweight naming signal (or at minimum, consistent use of `static`) so internal-linkage helpers are visually distinguishable from the module's public API

## Why It Matters

`static` functions and variables have internal linkage — invisible outside their translation unit — which is exactly the right scope for implementation helpers. But within a large `.c` file, it still helps readers (and reviewers scanning a diff) to tell at a glance which functions are private helpers versus the small set of functions declared in the corresponding header.

## Bad

```c
/* widget.c: no visual distinction between the 2 public functions and 8 helpers */
int validate(const char *name) { ... }        /* not even marked static: accidentally exported */
int compute_hash(const char *name) { ... }
widget *widget_create(const char *name) { ... }
void widget_destroy(widget *w) { ... }
```

## Good

```c
/* widget.c */
static int validate(const char *name) { ... }        /* static: internal linkage, and visually flagged as private */
static int compute_hash(const char *name) { ... }

widget *widget_create(const char *name) { ... }         /* no `static`: this is public, matches widget.h */
void    widget_destroy(widget *w) { ... }
```

## A grep-Friendly Habit: Group Statics Together or Prefix Consciously

```c
/* Some projects additionally prefix internal helpers, e.g. with an
 * underscore or a `priv_` marker, purely as an extra reading aid —
 * this is optional and secondary to marking them `static` in the first place: */
static int priv_validate(const char *name) { ... }
```

## See Also

- [api-minimal-public-surface](api-minimal-public-surface.md) - Why internal helpers should be `static` in the first place
- [name-avoid-reserved-identifiers](name-avoid-reserved-identifiers.md) - Reserved leading-underscore prefixes to avoid at file scope too
- [proj-one-module-per-file](proj-one-module-per-file.md) - Module boundaries this convention reinforces
