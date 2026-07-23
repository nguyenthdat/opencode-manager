# err-error-enum-not-magic-int

> Represent error codes as a named `enum`, not bare integer literals

## Why It Matters

Bare integers (`return 1;`, `return -2;`) require every caller to memorize (or go look up) what each number means, and a typo (`return 2` instead of `return 3`) is not caught by the compiler. An `enum` gives every error a name, lets the compiler flag unhandled cases in a `switch`, and is self-documenting at every call site.

## Bad

```c
int parse_config(const char *path) {
    if (!path) return 1;         /* what is 1? */
    FILE *fp = fopen(path, "r");
    if (!fp) return 2;            /* what is 2? */
    if (!valid_format(fp)) return 3;
    return 0;
}

/* Caller has to know these numbers from memory or documentation */
int rc = parse_config(path);
if (rc == 2) { /* ... */ }
```

## Good

```c
typedef enum {
    CONFIG_OK = 0,
    CONFIG_ERR_NULL_PATH,
    CONFIG_ERR_OPEN_FAILED,
    CONFIG_ERR_BAD_FORMAT,
} config_status;

config_status parse_config(const char *path) {
    if (!path) return CONFIG_ERR_NULL_PATH;
    FILE *fp = fopen(path, "r");
    if (!fp) return CONFIG_ERR_OPEN_FAILED;
    if (!valid_format(fp)) return CONFIG_ERR_BAD_FORMAT;
    fclose(fp);
    return CONFIG_OK;
}

config_status rc = parse_config(path);
switch (rc) {
    case CONFIG_OK:               break;
    case CONFIG_ERR_NULL_PATH:    fprintf(stderr, "no path given\n"); break;
    case CONFIG_ERR_OPEN_FAILED:  fprintf(stderr, "cannot open file\n"); break;
    case CONFIG_ERR_BAD_FORMAT:   fprintf(stderr, "malformed config\n"); break;
}
```

## Pair With a to-String Function

```c
const char *config_status_str(config_status s) {
    switch (s) {
        case CONFIG_OK:              return "ok";
        case CONFIG_ERR_NULL_PATH:   return "null path";
        case CONFIG_ERR_OPEN_FAILED: return "open failed";
        case CONFIG_ERR_BAD_FORMAT:  return "bad format";
    }
    return "unknown error";
}
```

## See Also

- [type-enum-for-closed-sets](type-enum-for-closed-sets.md) - General guidance on enums for closed sets of values
- [err-consistent-return-codes](err-consistent-return-codes.md) - Fitting enums into a broader convention
- [anti-magic-numbers](anti-magic-numbers.md) - The general anti-pattern this specifically addresses
