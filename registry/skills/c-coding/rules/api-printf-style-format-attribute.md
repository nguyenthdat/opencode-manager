# api-printf-style-format-attribute

> Annotate every `printf`-style variadic public function with `__attribute__((format(printf, ...)))` (or the MSVC equivalent) so the compiler checks format strings at call sites

## Why It Matters

A public API that accepts a format string and variadic arguments (logging, custom `printf` wrappers) loses all of the compiler's built-in format-string/argument-type checking unless it's explicitly told which parameter is the format string and where the variadic arguments start. Without the attribute, callers get zero warnings for exactly the kind of format-string/argument mismatch that is undefined behavior.

## Bad

```c
/* log.h */
void log_infof(const char *fmt, ...);   /* no format checking at any call site */

/* consumer.c */
long id = get_id();
log_infof("processing id=%d", id);   /* %d vs long: mismatch, no warning emitted */
```

## Good

```c
/* log.h */
#if defined(__GNUC__) || defined(__clang__)
#define LOG_PRINTF_LIKE(fmt_idx, args_idx) \
    __attribute__((format(printf, fmt_idx, args_idx)))
#else
#define LOG_PRINTF_LIKE(fmt_idx, args_idx)
#endif

void log_infof(const char *fmt, ...) LOG_PRINTF_LIKE(1, 2);
/* fmt_idx=1: fmt is the 1st parameter; args_idx=2: variadic args start at the 2nd */

/* consumer.c, compiled with -Wall -Wformat */
long id = get_id();
log_infof("processing id=%d", id);   /* now: "format '%d' expects 'int', has type 'long'" */
log_infof("processing id=%ld", id);   /* correct, no warning */
```

## Member Function Offset (1-Based, Includes Implicit this in C++ Only)

In plain C there is no implicit `this`, so the format string is always counted from parameter 1. This distinction matters if a shared header is compiled as both C and C++.

## See Also

- [ub-format-string-mismatch](ub-format-string-mismatch.md) - The specific undefined behavior this attribute catches early
- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - `-Wformat` must be enabled for this to take effect
- [doc-doxygen-function-comments](doc-doxygen-function-comments.md) - Documenting variadic API contracts
