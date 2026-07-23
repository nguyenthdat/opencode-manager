# api-stable-abi-layout

> For a shared library with a versioned ABI, avoid changing struct layout or function signatures in ways that break binary compatibility

## Why It Matters

Consumers of a shared library (`.so`/`.dll`) link against its symbols and, if they include your public struct definitions directly, against your exact memory layout. Adding a field in the middle of a public struct, changing a function's parameter types, or reordering enum values silently breaks every prebuilt binary that depends on the old layout — without a compile error, since the mismatch is only visible at runtime as corrupted data.

## Bad

```c
/* v1.0 public header */
struct widget_config {
    int timeout_ms;
    int retries;
};

/* v1.1: inserting a field in the middle shifts every subsequent field's
 * offset — binaries built against v1.0 now read the wrong bytes. */
struct widget_config {
    int timeout_ms;
    int max_connections;   /* inserted: breaks ABI for existing binaries */
    int retries;
};
```

## Good

```c
/* Prefer an opaque type plus accessor functions, so layout is a private
 * implementation detail that can freely change: */
typedef struct widget_config widget_config;   /* opaque in the public header */

widget_config *widget_config_create(void);
void widget_config_set_timeout_ms(widget_config *c, int ms);
void widget_config_set_max_connections(widget_config *c, int n);  /* adding this is ABI-safe */

/* If a plain struct must stay in the public ABI, only ever append new fields
 * at the end, and reserve padding up front for anticipated growth: */
struct widget_config_v2 {
    int timeout_ms;
    int retries;
    int reserved[4];   /* future fields can use this space without resizing the struct */
};
```

## Symbol Versioning

For libraries distributed as prebuilt shared objects, use linker version scripts (`.map` files) or `__attribute__((symbol_version(...)))` to let old and new ABI-incompatible versions of a function coexist under the same library major version, rather than silently changing behavior underneath existing callers.

## See Also

- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - The primary technique for avoiding this class of break
- [proj-versioned-public-header](proj-versioned-public-header.md) - Header versioning practices
- [mem-struct-padding-awareness](mem-struct-padding-awareness.md) - Layout considerations that also affect ABI
