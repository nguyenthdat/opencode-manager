# ptr-no-dangling-return

> Never return a pointer to a local (stack) variable from a function

## Why It Matters

A local variable's storage is only valid until its enclosing block/function returns. Returning its address gives the caller a dangling pointer that appears to work by accident (the stack memory hasn't been overwritten yet) and then fails unpredictably as soon as another function call reuses that stack space.

## Bad

```c
char *make_greeting(const char *name) {
    char buf[64];
    snprintf(buf, sizeof(buf), "Hello, %s!", name);
    return buf;          /* buf's storage is gone the instant this returns */
}

int *first_n(int n) {
    int values[16];
    for (int i = 0; i < n; i++) values[i] = i * i;
    return values;        /* same bug */
}
```

## Good

```c
/* Option 1: caller provides the buffer */
void make_greeting(const char *name, char *out, size_t out_size) {
    snprintf(out, out_size, "Hello, %s!", name);
}

/* Option 2: heap-allocate and document ownership transfer */
char *make_greeting_owned(const char *name) {
    char *buf = malloc(64);
    if (buf) {
        snprintf(buf, 64, "Hello, %s!", name);
    }
    return buf;   /* caller must free() */
}

/* Option 3: static storage, only for single-threaded, single-use cases */
static char scratch[64];
const char *make_greeting_static(const char *name) {
    snprintf(scratch, sizeof(scratch), "Hello, %s!", name);
    return scratch;   /* overwritten by the next call; document this clearly */
}
```

## See Also

- [mem-stack-vs-heap](mem-stack-vs-heap.md) - When stack allocation is (and isn't) appropriate
- [mem-single-owner-free](mem-single-owner-free.md) - Ownership discipline for the heap-return option
- [api-return-owned-vs-borrowed-doc](api-return-owned-vs-borrowed-doc.md) - Document which lifetime a return value has
