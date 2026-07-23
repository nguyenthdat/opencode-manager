# api-header-c-linkage-guard

> Wrap public C headers in `extern "C"` guards so they remain usable from C++ callers without name mangling issues

## Why It Matters

C++ mangles function names to encode overload information, while C does not. A C library header included by C++ code needs its declarations wrapped in `extern "C"` so the C++ compiler emits calls using the plain C symbol names the library was actually compiled with — otherwise linking fails with "undefined reference" errors despite the header being included correctly. This costs nothing for pure-C consumers, since `__cplusplus` is only defined when compiling as C++.

## Bad

```c
/* widget.h -- fails to link when included from a C++ translation unit */
#ifndef WIDGET_H
#define WIDGET_H

int widget_create(const char *name);
void widget_destroy(int handle);

#endif
```

## Good

```c
/* widget.h */
#ifndef WIDGET_H
#define WIDGET_H

#ifdef __cplusplus
extern "C" {
#endif

int  widget_create(const char *name);
void widget_destroy(int handle);

#ifdef __cplusplus
}
#endif

#endif /* WIDGET_H */
```

## Scope of This Rule

This applies specifically to headers meant to be consumed by both C and C++ (common for libraries like SQLite, zlib, and curl). A header that will only ever be included by other C source in the same project does not need it — but any header shipped as part of a library's public interface should include the guard defensively, since you rarely control every future consumer.

## See Also

- [name-header-guard-naming](name-header-guard-naming.md) - The `#ifndef`/`#define` include guard shown above
- [api-opaque-struct-encapsulation](api-opaque-struct-encapsulation.md) - Another public-header design concern
- [proj-versioned-public-header](proj-versioned-public-header.md) - Public header stability practices
