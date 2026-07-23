# doc-document-error-conditions

> Enumerate every specific error condition a function can produce in its documentation, not just "may fail"

## Why It Matters

"Returns non-zero on error" tells a caller nothing about which failures to actually anticipate and handle differently (a missing file versus a permissions problem versus malformed content usually warrant different responses). Enumerating each specific condition lets callers write correct, specific error handling instead of one generic catch-all branch.

## Bad

```c
/** Loads the config file. Returns non-zero on error. */
int config_load(const char *path, struct config *out);
```

## Good

```c
/**
 * Loads and parses the configuration file at `path`.
 *
 * @return 0 on success.
 * @return -ENOENT  `path` does not exist.
 * @return -EACCES  `path` exists but is not readable by this process.
 * @return -EINVAL  `path` is readable but contains malformed config syntax.
 * @return -ENOMEM  allocation failed while parsing.
 */
int config_load(const char *path, struct config *out);
```

## Let the Caller React Differently to Different Failures

```c
int rc = config_load(path, &cfg);
switch (rc) {
    case 0:            break;
    case -ENOENT:       use_default_config(&cfg); break;   /* recoverable: fall back */
    case -EACCES:       fprintf(stderr, "permission denied: %s\n", path); return 1;
    case -EINVAL:       fprintf(stderr, "malformed config: %s\n", path); return 1;
    default:            fprintf(stderr, "unexpected error %d\n", rc); return 1;
}
```

## See Also

- [err-document-error-contract](err-document-error-contract.md) - The header-level contract this documents in detail
- [err-error-enum-not-magic-int](err-error-enum-not-magic-int.md) - Naming the conditions being enumerated
- [doc-doxygen-function-comments](doc-doxygen-function-comments.md) - The broader comment format this fits into
