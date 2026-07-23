# ptr-null-check-before-deref

> Check a pointer against `NULL` before dereferencing it whenever it can plausibly be `NULL`

## Why It Matters

Dereferencing a `NULL` pointer is undefined behavior. On mainstream platforms it typically segfaults immediately, which is at least easy to find, but on some embedded targets address `0` is mapped and a `NULL` deref silently corrupts memory instead of crashing.

## Bad

```c
struct user *find_user(const char *name);

void greet(const char *name) {
    struct user *u = find_user(name);
    printf("Hello, %s\n", u->display_name);  /* crashes if not found */
}
```

## Good

```c
void greet(const char *name) {
    struct user *u = find_user(name);
    if (u == NULL) {
        printf("Hello, stranger\n");
        return;
    }
    printf("Hello, %s\n", u->display_name);
}
```

## Where This Matters Most

```c
/* Function arguments from external callers */
int process(struct request *req) {
    if (req == NULL) {
        return -EINVAL;
    }
    return handle(req);
}

/* Return values of allocation and lookup functions */
char *buf = malloc(size);
if (!buf) return -ENOMEM;

/* Optional out-parameters passed by pointer */
void get_stats(struct stats *out) {
    if (out) {          /* caller may pass NULL to mean "don't care" */
        out->count = counter;
    }
}
```

## See Also

- [mem-check-malloc-failure](mem-check-malloc-failure.md) - NULL-checking allocator results specifically
- [ub-null-pointer-arithmetic](ub-null-pointer-arithmetic.md) - Arithmetic on NULL is also undefined
- [err-check-return-values](err-check-return-values.md) - Broader return-value checking discipline
