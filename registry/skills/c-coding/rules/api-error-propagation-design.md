# api-error-propagation-design

> Design a library's API around one propagation mechanism (return codes) and make every fallible function follow it, including "unlikely to fail" ones

## Why It Matters

If some functions in a library signal failure via return code, others via a global "last error," and others just `abort()`, callers have to special-case every function individually and error handling becomes unreliable in practice. A single, library-wide propagation design lets callers write generic error-handling wrappers and makes the failure modes of the whole API predictable from a handful of documented rules.

## Bad

```c
int   widget_create(const char *name, widget **out);  /* returns error code */
widget *widget_clone(const widget *w);                  /* NULL on failure, no code */
void   widget_rename(widget *w, const char *name);       /* aborts internally on OOM, no way to recover */
```

## Good

```c
/* Library-wide convention, documented once: every fallible function returns
 * 0 on success or a negative widget_error_t; out-parameters are only valid
 * on success. */
typedef enum {
    WIDGET_OK = 0,
    WIDGET_ERR_NOMEM = -1,
    WIDGET_ERR_INVALID_NAME = -2,
} widget_error_t;

int widget_create(const char *name, widget **out);
int widget_clone(const widget *w, widget **out);
int widget_rename(widget *w, const char *name);

widget *w;
if (widget_create("gizmo", &w) != WIDGET_OK) {
    /* every call site handles failure the same way */
}
```

## Layering: Wrapping a Lower-Level API That Uses a Different Convention

```c
/* If you must call a POSIX function (errno-based) from inside a library that
 * uses negative-error-code convention, translate at the boundary: */
int widget_open_file(const char *path) {
    int fd = open(path, O_RDONLY);
    return (fd >= 0) ? fd : -errno;   /* one clear translation point */
}
```

## See Also

- [err-consistent-return-codes](err-consistent-return-codes.md) - The return-code discipline this rule builds on
- [err-negative-errno-convention](err-negative-errno-convention.md) - A concrete convention to standardize on
- [err-document-error-contract](err-document-error-contract.md) - Documenting the chosen convention per function
