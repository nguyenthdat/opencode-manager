# err-check-return-values

> Check the return value of every function that can fail, including "boring" ones like `close`, `write`, and `fclose`

## Why It Matters

C reports most failures through return codes, not exceptions. A function call whose return value is silently ignored means the failure is invisible until it causes damage somewhere else — a lost write, a corrupted file, a resource leak — far from the actual point of failure, which makes debugging much harder.

## Bad

```c
fwrite(data, 1, len, fp);     /* short write on a full disk goes unnoticed */
fclose(fp);                    /* buffered write errors surface here and are dropped */
free(ptr);                     /* fine to ignore: free doesn't fail */
write(fd, buf, n);              /* partial write ignored */
```

## Good

```c
size_t written = fwrite(data, 1, len, fp);
if (written != len) {
    perror("fwrite");
    return -1;
}

if (fclose(fp) != 0) {
    perror("fclose");
    return -1;
}

ssize_t n_written = write(fd, buf, n);
if (n_written < 0) {
    perror("write");
    return -1;
} else if ((size_t)n_written != n) {
    /* handle short write: loop, or treat as an error depending on the contract */
}
```

## Marking Functions "Must Check"

```c
#if defined(__GNUC__) || defined(__clang__)
#define MUST_CHECK __attribute__((warn_unused_result))
#else
#define MUST_CHECK
#endif

MUST_CHECK int save_config(const struct config *cfg);
/* compiler now warns at every call site that ignores the return value */
```

## See Also

- [err-negative-errno-convention](err-negative-errno-convention.md) - A concrete return-code convention
- [anti-ignoring-syscall-return-value](anti-ignoring-syscall-return-value.md) - The anti-pattern this rule prevents
- [lint-enable-wall-wextra-wpedantic](lint-enable-wall-wextra-wpedantic.md) - Compiler flags that surface some of these
