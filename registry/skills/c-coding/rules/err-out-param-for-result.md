# err-out-param-for-result

> Return the status code from the function and hand back the actual result through an output parameter

## Why It Matters

Overloading a single return value to carry both "did it succeed" and "what's the result" forces awkward sentinel values (`-1`, `NULL`, `INT_MIN`) that can collide with legitimate results. Separating status (return value) from data (out-parameter) removes that ambiguity entirely and composes cleanly with `err-goto-cleanup-single-exit`.

## Bad

```c
int parse_port(const char *s) {
    long v = strtol(s, NULL, 10);
    if (v < 1 || v > 65535) {
        return -1;          /* but -1 could theoretically also be a "valid" sentinel elsewhere */
    }
    return (int)v;
}
/* Caller can't distinguish "parse failed" from "parsed value happened to be -1"
 * in a differently-shaped version of this function that allows negative results. */
```

## Good

```c
int parse_port(const char *s, uint16_t *out_port) {
    char *end;
    errno = 0;
    long v = strtol(s, &end, 10);
    if (errno != 0 || end == s || *end != '\0' || v < 1 || v > 65535) {
        return -EINVAL;      /* status only */
    }
    *out_port = (uint16_t)v;   /* result only */
    return 0;
}

uint16_t port;
if (parse_port("8080", &port) != 0) {
    fprintf(stderr, "invalid port\n");
    return 1;
}
```

## Multiple Results

```c
int divmod(int a, int b, int *quotient, int *remainder) {
    if (b == 0) return -EINVAL;
    *quotient = a / b;
    *remainder = a % b;
    return 0;
}
```

## See Also

- [err-consistent-return-codes](err-consistent-return-codes.md) - Keeping the status convention uniform
- [ptr-pointer-to-pointer-clarity](ptr-pointer-to-pointer-clarity.md) - When the out-param itself is a pointer
- [api-out-param-convention](api-out-param-convention.md) - Ordering and naming conventions for out-parameters
