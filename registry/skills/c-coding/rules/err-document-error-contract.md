# err-document-error-contract

> Document, in the header, exactly which error codes a function can return and what each one means

## Why It Matters

C's type system carries no information about which errors a function can produce — that contract exists only in documentation (or in the caller's memory). Without it written down, callers either guess, copy-paste error handling from elsewhere without understanding it, or silently ignore cases the function can actually hit.

## Bad

```c
/* config.h */
int config_load(const char *path, struct config *out);
/* no indication of what a non-zero return means, or which codes are possible */
```

## Good

```c
/* config.h */

/**
 * Load configuration from `path` into `out`.
 *
 * Returns:
 *   0                     success
 *   -ENOENT               file does not exist
 *   -EACCES               file exists but is not readable
 *   -EINVAL               file exists and is readable but is not valid config syntax
 *
 * On any non-zero return, *out is left unmodified.
 */
int config_load(const char *path, struct config *out);
```

## Keep the Contract and the Code in Sync

```c
int config_load(const char *path, struct config *out) {
    if (access(path, F_OK) != 0) return -ENOENT;
    if (access(path, R_OK) != 0) return -EACCES;
    /* ... */
    if (!parse(buf, out)) return -EINVAL;
    return 0;
    /* If a new failure mode is added here, update the header comment too. */
}
```

## Tie Documentation to Tests

A documented error contract is only trustworthy if it's exercised: for every documented error code, have at least one test that forces that exact condition and asserts the exact code comes back.

## See Also

- [doc-document-error-conditions](doc-document-error-conditions.md) - Broader documentation conventions for errors
- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - Naming the codes being documented
- [test-boundary-value-testing](test-boundary-value-testing.md) - Testing each documented error path
