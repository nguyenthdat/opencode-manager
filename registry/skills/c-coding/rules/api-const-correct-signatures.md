# api-const-correct-signatures

> Apply `const` throughout public function signatures so the API itself documents what can and cannot be mutated

## Why It Matters

A public API's signatures are often the only documentation a caller reads before using it. Marking every pointer parameter `const` unless the function genuinely writes through it lets callers immediately see which calls are safe to make on read-only or shared data, and lets the compiler catch accidental misuse rather than relying on prose documentation.

## Bad

```c
/* Can these mutate what's pointed to? Unclear from the signature alone. */
int  widget_compare(struct widget *a, struct widget *b);
void widget_print(struct widget *w);
size_t widget_name_len(struct widget *w);
```

## Good

```c
int    widget_compare(const struct widget *a, const struct widget *b);
void   widget_print(const struct widget *w);
size_t widget_name_len(const struct widget *w);

/* Genuinely mutating functions stand out by contrast: */
void widget_rename(struct widget *w, const char *new_name);   /* w mutates, new_name doesn't */
```

## const Return Types for Read-Only Views

```c
/* Returning a const pointer signals "you may read this, but the library
 * still owns it and you must not mutate or free it." */
const char *widget_name(const widget *w) {
    return w->name;
}
```

## See Also

- [ptr-const-correct-params](ptr-const-correct-params.md) - The underlying pointer-level rule
- [type-const-correctness](type-const-correctness.md) - Broader `const` usage across a codebase
- [api-return-owned-vs-borrowed-doc](api-return-owned-vs-borrowed-doc.md) - Documenting ownership alongside constness
