# test-descriptive-test-names

> Name each test function after the specific behavior it verifies, in the form `test_<unit>_<condition>_<expected_result>`

## Why It Matters

A test named `test1` or `test_parse` tells a reader (or a CI failure notification) nothing about what actually broke. A descriptive name lets a failing test's name alone communicate the regression, without needing to open the test file, which matters most exactly when you're triaging a red CI run under time pressure.

## Bad

```c
void test1(void) { assert(parse_port("8080", &p) == 0); }
void test2(void) { assert(parse_port("99999", &p) != 0); }
void test_parse(void) { assert(parse_port("", &p) != 0); }
```

## Good

```c
void test_parse_port_accepts_valid_port(void) {
    uint16_t port;
    assert(parse_port("8080", &port) == 0 && port == 8080);
}

void test_parse_port_rejects_out_of_range_value(void) {
    uint16_t port;
    assert(parse_port("99999", &port) != 0);
}

void test_parse_port_rejects_empty_string(void) {
    uint16_t port;
    assert(parse_port("", &port) != 0);
}
```

## Failure Output Becomes Self-Explanatory

```
FAIL: test_parse_port_rejects_out_of_range_value (test_parser.c:42)
```

versus the much less useful:

```
FAIL: test2 (test_parser.c:42)
```

## See Also

- [test-arrange-act-assert-c](test-arrange-act-assert-c.md) - Structuring the body of a well-named test
- [test-boundary-value-testing](test-boundary-value-testing.md) - The kind of specific conditions worth naming precisely
- [doc-comment-why-not-what](doc-comment-why-not-what.md) - Related "make the code self-explanatory" principle
