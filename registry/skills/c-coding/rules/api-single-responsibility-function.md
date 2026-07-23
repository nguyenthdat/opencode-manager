# api-single-responsibility-function

> Give each public function exactly one responsibility, and split functions that both compute and have side effects into separate calls where practical

## Why It Matters

A function that validates input, allocates memory, performs I/O, and logs errors all in one body is hard to test (you can't exercise validation without also touching disk), hard to reuse (callers who need only the validation logic must pay for the I/O too), and hard to reason about when something fails partway through.

## Bad

```c
/* Validates, opens a file, parses it, AND logs errors — four responsibilities */
int load_and_validate_config(const char *path, struct config *out) {
    if (!path || !*path) {
        fprintf(stderr, "error: empty path\n");   /* logging mixed into a "load" function */
        return -1;
    }
    FILE *fp = fopen(path, "r");
    if (!fp) {
        fprintf(stderr, "error: cannot open %s\n", path);
        return -1;
    }
    /* parse + validate inline, ~100 more lines */
    fclose(fp);
    return 0;
}
```

## Good

```c
/* Each function has one job and can be tested/reused independently. */
bool config_path_is_valid(const char *path) {
    return path != NULL && *path != '\0';
}

int config_parse_stream(FILE *fp, struct config *out);   /* pure parsing, no I/O concerns beyond the given stream */

int config_load(const char *path, struct config *out) {
    if (!config_path_is_valid(path)) {
        return -EINVAL;
    }
    FILE *fp = fopen(path, "r");
    if (!fp) {
        return -errno;
    }
    int rc = config_parse_stream(fp, out);
    fclose(fp);
    return rc;   /* caller decides how/whether to log */
}
```

## See Also

- [api-minimal-public-surface](api-minimal-public-surface.md) - Keeping the resulting public API small and composable
- [test-unit-test-framework](test-unit-test-framework.md) - Small, focused functions are far easier to unit test
- [anti-huge-functions](anti-huge-functions.md) - The anti-pattern this rule specifically prevents
