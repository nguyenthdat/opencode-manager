# proj-versioned-public-header

> Expose a library's version number programmatically through its public header, not just in documentation or a build script

## Why It Matters

Consumers linking against a shared library at runtime, or checking compatibility at build time, need a reliable, code-level way to query the version they actually got — a `README` or changelog entry isn't inspectable at compile time or by automated build tooling, and mismatches between a documented version and the actual shipped binary do happen.

## Bad

```c
/* widget.h has no version information at all; consumers have no
 * programmatic way to check compatibility before or during a build */
widget *widget_create(const char *name);
```

## Good

```c
/* widget.h */
#define WIDGET_VERSION_MAJOR 2
#define WIDGET_VERSION_MINOR 3
#define WIDGET_VERSION_PATCH 1
#define WIDGET_VERSION_STRING "2.3.1"

/* Runtime accessor, useful when linking dynamically against a version that
 * might differ from the one a consumer was compiled against. */
const char *widget_version_string(void);
int widget_version_major(void);

/* Compile-time capability check example: */
#if WIDGET_VERSION_MAJOR < 2
#error "this code requires widget library version 2.0 or later"
#endif
```

## Runtime vs Compile-Time Version Checks

The macros allow a `#if` check at compile time against the headers a consumer built against; the runtime functions let a consumer additionally verify, at startup, that the shared library it dynamically linked against actually matches (important since a stale `.so` on disk could otherwise silently mismatch the headers used to compile).

## See Also

- [doc-changelog-versioning](doc-changelog-versioning.md) - Documenting what changed between versions
- [api-stable-abi-layout](api-stable-abi-layout.md) - The ABI stability concerns version numbers usually track
- [proj-public-vs-private-headers-dir](proj-public-vs-private-headers-dir.md) - Where this header lives in the project layout
