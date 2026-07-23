# anti-huge-functions

> Don't let a function grow to hundreds of lines covering multiple responsibilities; split it along natural sub-task boundaries

## Why It Matters

A huge function is hard to hold in your head all at once, hard to unit-test in isolation (its sub-behaviors can't be exercised independently), and tends to accumulate deeply nested control flow and duplicated logic as it grows, since there's no natural boundary forcing reuse instead of copy-paste.

## Bad

```c
/* One 300-line function that reads input, validates it, transforms it,
 * writes output, and logs — all inline, with no internal structure */
int process_request(struct request *req) {
    /* ~40 lines of validation */
    /* ~80 lines of parsing */
    /* ~100 lines of business logic */
    /* ~50 lines of response formatting */
    /* ~30 lines of logging */
    return 0;
}
```

## Good

```c
static int validate_request(const struct request *req);
static int parse_request_body(const struct request *req, struct parsed_data *out);
static int apply_business_logic(const struct parsed_data *data, struct result *out);
static int format_response(const struct result *result, struct response *out);

int process_request(struct request *req) {
    int rc;

    rc = validate_request(req);
    if (rc != 0) return rc;

    struct parsed_data data;
    rc = parse_request_body(req, &data);
    if (rc != 0) return rc;

    struct result result;
    rc = apply_business_logic(&data, &result);
    if (rc != 0) return rc;

    struct response resp;
    return format_response(&result, &resp);
}
```

## A Practical Signal It's Time to Split

If you have to scroll to see the whole function, or if you find yourself writing a comment like `/* --- validation --- */` to section off part of a function's body, that section is very likely ready to become its own function.

## See Also

- [api-single-responsibility-function](api-single-responsibility-function.md) - The principle this anti-pattern violates
- [anti-deeply-nested-code](anti-deeply-nested-code.md) - A frequently co-occurring anti-pattern
- [test-static-functions-via-include](test-static-functions-via-include.md) - Testing the smaller, extracted functions independently
