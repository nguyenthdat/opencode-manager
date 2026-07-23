# anti-deeply-nested-code

> Don't nest conditionals and loops more than 2-3 levels deep; use early returns/guard clauses to flatten control flow

## Why It Matters

Deeply nested code forces a reader to hold every enclosing condition in their head simultaneously to understand what a deeply-indented line actually requires to execute. Guard clauses (returning or `continue`-ing early on the "uninteresting" case) let each condition be checked and dismissed independently, keeping the "main path" of the function at a shallow, readable indentation level.

## Bad

```c
int process(struct request *req) {
    if (req != NULL) {
        if (req->body != NULL) {
            if (req->body_len > 0) {
                if (validate(req->body, req->body_len)) {
                    return handle(req);
                } else {
                    return -EINVAL;
                }
            } else {
                return -EINVAL;
            }
        } else {
            return -EINVAL;
        }
    } else {
        return -EINVAL;
    }
}
```

## Good

```c
int process(struct request *req) {
    if (req == NULL) return -EINVAL;
    if (req->body == NULL) return -EINVAL;
    if (req->body_len == 0) return -EINVAL;
    if (!validate(req->body, req->body_len)) return -EINVAL;

    return handle(req);   /* main logic stays at the top indentation level */
}
```

## See Also

- [err-goto-cleanup-single-exit](err-goto-cleanup-single-exit.md) - A related flow-control pattern for multi-resource functions
- [api-single-responsibility-function](api-single-responsibility-function.md) - Splitting complex functions reduces nesting pressure too
- [anti-huge-functions](anti-huge-functions.md) - The related anti-pattern of functions that grow too large to read easily
