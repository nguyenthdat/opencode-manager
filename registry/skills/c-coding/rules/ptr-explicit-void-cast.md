# ptr-explicit-void-cast

> Cast a `void *` explicitly when assigning to or from an incompatible pointer type, and never obscure a type change with an implicit cast

## Why It Matters

C implicitly converts between `void *` and any object pointer type, which is convenient for generic APIs (`malloc`, `qsort`, callback contexts) but can also silently hide a mismatched type if you're not careful, especially at API boundaries where a `void *` is later cast back to a concrete type by convention rather than by the type system.

## Bad

```c
void *make_item(void);

int main(void) {
    /* Implicit chain: void* -> struct item* happens silently; a typo here
     * (assigning to the wrong struct pointer type) would go undetected in C
     * (note: in C, unlike C++, this specific conversion doesn't need a cast,
     * which is exactly the risk — nothing forces you to double check it). */
    struct other_item *oi = make_item();   /* wrong type, compiles with only a warning at best */
}
```

## Good

```c
void *make_item(void);

int main(void) {
    struct item *it = (struct item *)make_item();   /* explicit cast documents the intended type */
    /* Compile with -Wall -Wextra and treat cast-related warnings as errors
     * so a genuine mismatch is caught even though the cast itself compiles. */
}
```

## Generic Callback Context Pattern

```c
typedef void (*task_fn)(void *ctx);

struct my_ctx { int count; };

void run_task(task_fn fn, void *ctx) {
    fn(ctx);
}

static void my_task(void *ctx) {
    struct my_ctx *c = (struct my_ctx *)ctx;   /* explicit cast back to the known type */
    c->count++;
}
```

## See Also

- [ptr-type-punning-memcpy](ptr-type-punning-memcpy.md) - When a cast alone isn't safe for reinterpreting bytes
- [api-callback-with-userdata](api-callback-with-userdata.md) - The `void *ctx` pattern shown above
- [type-generic-macro](type-generic-macro.md) - `_Generic` as a type-safe alternative in some cases
