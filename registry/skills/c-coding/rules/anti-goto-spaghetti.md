# anti-goto-spaghetti

> Don't use `goto` for arbitrary jumps, backward loops, or jumping into the middle of a block; reserve it for the forward-only cleanup pattern

## Why It Matters

`goto` earned its historical bad reputation from exactly this kind of use: jumping backward to re-run earlier code (reinventing a loop badly), jumping into the middle of a nested block, or jumping between unrelated sections of a function. This produces genuinely hard-to-follow control flow. The single, well-scoped exception the C community broadly endorses is a forward jump to one cleanup label at the end of a function — anything beyond that reintroduces the problems `goto`'s reputation is based on.

## Bad

```c
int process(void) {
    int i = 0;
retry:
    if (do_step(i) != 0) {
        i++;
        if (i < 3) goto retry;   /* backward jump reinventing a loop, badly */
        return -1;
    }

    if (some_condition) {
        goto middle;                /* jumping into the middle of unrelated logic below */
    }
    setup_a();
middle:
    setup_b();                        /* setup_a may or may not have run before reaching here: confusing */
    return 0;
}
```

## Good

```c
int process(void) {
    for (int i = 0; i < 3; i++) {   /* an actual loop, not a goto pretending to be one */
        if (do_step(i) == 0) {
            break;
        }
        if (i == 2) return -1;
    }

    if (!some_condition) {
        setup_a();
    }
    setup_b();
    return 0;
}

/* The one broadly-accepted use: forward-only jump to a single cleanup label */
int acquire_resources(void) {
    int rc = -1;
    void *a = NULL, *b = NULL;
    a = acquire_a();
    if (!a) goto cleanup;
    b = acquire_b();
    if (!b) goto cleanup;
    rc = 0;
cleanup:
    release_b(b);
    release_a(a);
    return rc;
}
```

## See Also

- [err-goto-cleanup-single-exit](err-goto-cleanup-single-exit.md) - The one legitimate `goto` pattern this rule carves out
- [anti-deeply-nested-code](anti-deeply-nested-code.md) - A cleaner alternative to some goto-driven control flow
- [api-single-responsibility-function](api-single-responsibility-function.md) - Smaller functions reduce the temptation for complex goto flows
