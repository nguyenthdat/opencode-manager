# test-arrange-act-assert-c

> Structure every C test in three clear phases — arrange (set up inputs), act (call the function under test), assert (check the result) — with a blank line between them

## Why It Matters

Tests that interleave setup, invocation, and checking are harder to scan and harder to modify safely: a reviewer can't tell at a glance what's being set up versus what's actually being verified. The arrange-act-assert shape is a small, free readability convention that also naturally discourages testing more than one thing per test function.

## Bad

```c
void test_parse_config(void) {
    struct config cfg;
    assert(config_parse("timeout=30\n", &cfg) == 0);
    struct config cfg2;
    cfg2.timeout_ms = 30000;
    assert(cfg.timeout_ms == cfg2.timeout_ms);
    assert(config_parse("", &cfg) != 0);   /* second, unrelated case mixed into the same test */
}
```

## Good

```c
void test_parse_config_extracts_timeout(void) {
    /* Arrange */
    const char *input = "timeout=30\n";
    struct config cfg;

    /* Act */
    int rc = config_parse(input, &cfg);

    /* Assert */
    assert(rc == 0);
    assert(cfg.timeout_ms == 30000);
}

void test_parse_config_rejects_empty_input(void) {
    /* Arrange */
    const char *input = "";
    struct config cfg;

    /* Act */
    int rc = config_parse(input, &cfg);

    /* Assert */
    assert(rc != 0);
}
```

## See Also

- [test-descriptive-test-names](test-descriptive-test-names.md) - Naming that complements this structure
- [test-boundary-value-testing](test-boundary-value-testing.md) - Choosing what to arrange/assert for edge cases
- [test-unit-test-framework](test-unit-test-framework.md) - Frameworks that provide the assert vocabulary used here
