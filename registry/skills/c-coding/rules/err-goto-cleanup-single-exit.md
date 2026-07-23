# err-goto-cleanup-single-exit

> Use `goto` to jump forward to a single cleanup section when a function acquires multiple resources

## Why It Matters

Functions that allocate several resources (memory, file handles, locks) in sequence need to unwind exactly the resources they actually acquired if a later step fails. Nesting an `if` for every partial-failure case duplicates cleanup logic and is easy to get wrong; a single `goto cleanup` at the bottom of the function keeps teardown in one place and is idiomatic, widely-used C (this is the one broadly endorsed use of `goto` in modern C style guides, including the Linux kernel's).

## Bad

```c
int process_file(const char *path) {
    FILE *fp = fopen(path, "r");
    if (!fp) return -1;

    char *buf = malloc(4096);
    if (!buf) {
        fclose(fp);              /* duplicated cleanup */
        return -1;
    }

    struct parser *p = parser_create();
    if (!p) {
        free(buf);                 /* duplicated cleanup, and getting longer each level */
        fclose(fp);
        return -1;
    }

    int rc = parser_run(p, fp, buf);
    parser_destroy(p);
    free(buf);
    fclose(fp);
    return rc;
}
```

## Good

```c
int process_file(const char *path) {
    int rc = -1;
    FILE *fp = NULL;
    char *buf = NULL;
    struct parser *p = NULL;

    fp = fopen(path, "r");
    if (!fp) goto cleanup;

    buf = malloc(4096);
    if (!buf) goto cleanup;

    p = parser_create();
    if (!p) goto cleanup;

    rc = parser_run(p, fp, buf);

cleanup:
    parser_destroy(p);   /* each _destroy/free must itself accept NULL safely */
    free(buf);
    if (fp) fclose(fp);
    return rc;
}
```

## Rules for Safe goto-Cleanup

- Only ever jump forward, never backward (backward jumps re-introduce spaghetti control flow).
- Initialize every resource variable to `NULL`/a sentinel so cleanup can unconditionally free/close everything.
- Keep exactly one cleanup label per function; multiple labels for partial unwinding reintroduce the duplication this pattern avoids.

## See Also

- [mem-single-owner-free](mem-single-owner-free.md) - Ownership discipline that makes cleanup safe to repeat
- [err-partial-init-rollback](err-partial-init-rollback.md) - The general problem this pattern solves
- [anti-goto-spaghetti](anti-goto-spaghetti.md) - The misuse of `goto` this pattern is not
