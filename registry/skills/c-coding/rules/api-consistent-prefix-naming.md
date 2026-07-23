# api-consistent-prefix-naming

> Prefix every public symbol in a library with a short, consistent module name

## Why It Matters

C has a single, flat global namespace for functions, and (mostly) for types and macros. Two libraries that both define `create()` or `Node` will collide the moment both are linked into the same program. A consistent prefix (`widget_`, `WIDGET_`) acts as C's substitute for namespaces and also groups a module's public API together alphabetically in editors and generated docs.

## Bad

```c
/* widget.h */
void  init(void);
int   create(const char *name);
void  destroy(int handle);

/* logging.h, linked into the same binary */
void  init(void);   /* symbol collision at link time */
```

## Good

```c
/* widget.h */
void widget_init(void);
int  widget_create(const char *name);
void widget_destroy(int handle);

/* logging.h */
void log_init(void);
```

## Apply the Prefix Consistently Across Symbol Kinds

```c
/* Functions */
int    conn_open(const char *host);
void   conn_close(int fd);

/* Types */
typedef struct conn conn;
typedef enum conn_state conn_state;

/* Macros/constants */
#define CONN_MAX_RETRIES 5
#define CONN_DEFAULT_TIMEOUT_MS 3000
```

## See Also

- [name-macro-all-caps](name-macro-all-caps.md) - Macro naming specifics
- [name-avoid-reserved-identifiers](name-avoid-reserved-identifiers.md) - Prefixes to avoid (reserved to the implementation)
- [proj-versioned-public-header](proj-versioned-public-header.md) - Related public-API stability concerns
