# api-init-cleanup-pair

> Every `_create`/`_init`/`_open` function must have a matching `_destroy`/`_deinit`/`_close`, and both must be documented together

## Why It Matters

C has no destructors, so resource teardown is entirely the caller's responsibility, driven purely by convention. If a module exposes an "acquire" function without an equally discoverable, equally documented "release" counterpart (same prefix, same header, referenced from the acquire function's own doc comment), callers will forget to call it, or won't know it exists.

## Bad

```c
/* logger.h */
struct logger *logger_create(const char *path);
/* no logger_destroy in sight — is this freed automatically? never freed at all? */
```

## Good

```c
/* logger.h */

/** Opens a logger writing to `path`. Must be released with logger_destroy(). */
struct logger *logger_create(const char *path);

/** Flushes and releases all resources owned by `l`. Safe to call with l == NULL. */
void logger_destroy(struct logger *l);
```

## Symmetric Naming Across a Whole Library

```c
widget      *widget_create(const char *name);
void         widget_destroy(widget *w);

connection  *conn_open(const char *host);
void         conn_close(connection *c);

arena        arena_init(size_t capacity);
void         arena_deinit(arena *a);
/* pick one verb pair (create/destroy, open/close, init/deinit) per module and
 * apply it consistently rather than mixing styles within the same header. */
```

## Make the Destroy Function NULL-Safe

```c
void widget_destroy(widget *w) {
    if (!w) return;      /* mirrors free()'s NULL-safety, simplifies goto-cleanup patterns */
    free(w->name);
    free(w);
}
```

## See Also

- [mem-single-owner-free](mem-single-owner-free.md) - The ownership discipline this pairing enforces
- [err-goto-cleanup-single-exit](err-goto-cleanup-single-exit.md) - Relies on destroy functions being NULL-safe
- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - Frequently paired with this convention
