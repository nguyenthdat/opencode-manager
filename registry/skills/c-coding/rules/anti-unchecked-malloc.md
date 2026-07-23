# anti-unchecked-malloc

> Don't call `malloc`/`calloc`/`realloc` without checking the result for `NULL`

## Why It Matters

Every allocator call can fail, and dereferencing the resulting `NULL` pointer is undefined behavior. This is one of the most common and most avoidable defects in C code — the check is one `if` statement, and skipping it turns an anticipated, recoverable condition (out of memory) into a crash or worse.

## Bad

```c
struct node *n = malloc(sizeof(*n));
n->value = 5;               /* crashes if malloc returned NULL */

char *buf = malloc(len);
memcpy(buf, data, len);       /* UB on NULL */
```

## Good

```c
struct node *n = malloc(sizeof(*n));
if (!n) {
    return -ENOMEM;
}
n->value = 5;

char *buf = malloc(len);
if (!buf) {
    return -ENOMEM;
}
memcpy(buf, data, len);
```

## See Also

- [mem-check-malloc-failure](mem-check-malloc-failure.md) - The full rule this anti-pattern violates
- [err-check-return-values](err-check-return-values.md) - The general discipline this specific case falls under
- [err-fail-fast-invariant](err-fail-fast-invariant.md) - An alternative for tools where OOM should abort immediately
