# err-perror-strerror

> Report system-call failures with `strerror`/`perror` (or thread-safe `strerror_r`), not a bare error number

## Why It Matters

Printing a raw `errno` value (`fprintf(stderr, "error %d\n", errno)`) is meaningless to users and requires a manual lookup table to debug. `strerror`/`perror` translate the number into a human-readable, locale-aware message using the C library's own mapping, at essentially no cost.

## Bad

```c
FILE *fp = fopen(path, "r");
if (!fp) {
    fprintf(stderr, "fopen failed: %d\n", errno);   /* "fopen failed: 2" means nothing to a user */
    return -1;
}
```

## Good

```c
FILE *fp = fopen(path, "r");
if (!fp) {
    perror("fopen");                 /* prints: "fopen: No such file or directory" */
    return -1;
}

/* Or, when you need the message as a string rather than printed directly: */
FILE *fp2 = fopen(path, "r");
if (!fp2) {
    fprintf(stderr, "cannot open %s: %s\n", path, strerror(errno));
    return -1;
}
```

## Thread Safety: strerror_r

```c
/* strerror() may use a shared static buffer on some platforms; prefer the
 * reentrant form in multi-threaded code. */
char buf[256];
#if defined(_GNU_SOURCE)
char *msg = strerror_r(errno, buf, sizeof(buf));   /* GNU variant returns char* */
fprintf(stderr, "open failed: %s\n", msg);
#else
strerror_r(errno, buf, sizeof(buf));                 /* POSIX (XSI) variant returns int */
fprintf(stderr, "open failed: %s\n", buf);
#endif
```

## See Also

- [err-errno-usage](err-errno-usage.md) - When errno is valid to read at all
- [err-negative-errno-convention](err-negative-errno-convention.md) - Formatting errors from a negative-errno API
- [conc-thread-local-storage](conc-thread-local-storage.md) - Thread-safety considerations for error state
